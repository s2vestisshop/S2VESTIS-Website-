import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { resolveCartId } from '../db/cart.js';
import * as paymentsDb from '../db/payments.js';
import * as ordersDb from '../db/orders.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentMethod,
} from '../services/razorpay.js';

/** Shared by both quoteCart and placeOrder — both raise the same P0001-prefixed
 * exceptions (EMPTY_CART / INSUFFICIENT_STOCK:name:size / INVALID_COUPON:msg). */
function translateCartRpcError(err) {
  const msg = err.message || '';
  if (msg.startsWith('EMPTY_CART')) return ApiError.badRequest('Your cart is empty');
  if (msg.startsWith('INSUFFICIENT_STOCK')) {
    const [, name, size] = msg.split(':');
    return ApiError.badRequest(`Only limited stock left for ${name} (${size}) — please update your cart.`);
  }
  if (msg.startsWith('INVALID_COUPON')) {
    return ApiError.badRequest(msg.split(':').slice(1).join(':') || 'Invalid coupon code');
  }
  return null;
}

async function fetchPaymentMethodSafely(paymentId) {
  try {
    return await fetchPaymentMethod(paymentId);
  } catch {
    return null; // never let a Razorpay lookup hiccup block order completion
  }
}

async function runPlaceOrderForAttempt(attempt, method) {
  try {
    const order = await ordersDb.placeOrder(attempt.userId, attempt.cartId, {
      couponCode: attempt.couponCode,
      address: attempt.address,
      razorpayOrderId: attempt.razorpayOrderId,
      razorpayPaymentId: attempt.razorpayPaymentId,
      paymentMethod: method,
    });
    await paymentsDb.linkOrderToAttempt(attempt.id, order._id);
    if (Math.abs(order.total - attempt.amount) > 0.01) {
      await ordersDb.flagPaymentReview(
        order._id,
        `Razorpay captured ₹${attempt.amount}, order computed ₹${order.total}`
      );
    }
    return order;
  } catch (err) {
    const translated = translateCartRpcError(err);
    await paymentsDb.markPaymentAttemptFailed(attempt.id, translated ? translated.message : err.message);
    // Payment is already captured by this point — the raw cart error ("cart
    // is empty") would be confusing once money has already moved.
    throw ApiError.badRequest(
      "Your payment was received, but we couldn't complete the order automatically — we've been notified and will follow up by email."
    );
  }
}

/**
 * Turns a confirmed Razorpay payment into a real order. Called from both
 * verifyPayment (client callback) and handleWebhook (safety net) — they can
 * both race for the same payment, so this always goes through
 * claimPaymentAttempt's atomic conditional update first. Returns the order,
 * or null if this payment was already finalized-and-failed by whichever
 * caller won the race (nothing left to do).
 */
async function finalizeByRazorpayOrderId({ razorpayOrderId, razorpayPaymentId, method }) {
  const claimed = await paymentsDb.claimPaymentAttempt({ razorpayOrderId, razorpayPaymentId });
  if (claimed) return runPlaceOrderForAttempt(claimed, method);

  const existing = await paymentsDb.getPaymentAttemptByRazorpayOrderId(razorpayOrderId);
  if (!existing) throw ApiError.badRequest('Unrecognized payment order');
  if (existing.orderId) return ordersDb.getMyOrder(existing.userId, existing.orderId);
  return null; // already failed on whichever call won the race — don't retry here
}

// POST /api/payments/checkout — sizes a Razorpay order from the current cart
// and stages a payment_attempts row. No order/stock touched yet.
export const createCheckout = asyncHandler(async (req, res) => {
  const { address, couponCode } = req.body;
  const cartId = await resolveCartId(req);

  let quote;
  try {
    quote = await paymentsDb.quoteCart({ cartId, userId: req.user._id, couponCode });
  } catch (err) {
    const translated = translateCartRpcError(err);
    if (translated) throw translated;
    throw err;
  }

  const rzpOrder = await createRazorpayOrder({
    amountRupees: quote.total,
    receipt: `s2v_${Date.now()}`,
  });

  const attempt = await paymentsDb.createPaymentAttempt({
    userId: req.user._id,
    cartId,
    razorpayOrderId: rzpOrder.id,
    amount: quote.total,
    couponCode,
    address,
  });

  res.status(201).json({
    success: true,
    data: {
      razorpayOrderId: attempt.razorpayOrderId,
      amount: attempt.amount,
      currency: attempt.currency,
      keyId: env.razorpay.keyId,
      orderSummary: {
        subtotal: Number(quote.subtotal),
        discountTotal: Number(quote.discount_total),
        shippingTotal: Number(quote.shipping_total),
        total: Number(quote.total),
        itemCount: quote.item_count,
      },
    },
  });
});

// POST /api/payments/verify — the client-side callback after Razorpay
// Checkout reports success. Signature verification is the real gate; never
// trust the client's "it worked" on its own.
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const valid = verifyPaymentSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });
  if (!valid) throw ApiError.badRequest('Payment verification failed');

  const method = await fetchPaymentMethodSafely(razorpay_payment_id);
  const order = await finalizeByRazorpayOrderId({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    method,
  });
  if (!order) {
    throw ApiError.badRequest(
      "Your payment was received, but we couldn't complete the order — we've been notified and will follow up by email."
    );
  }
  res.status(201).json({ success: true, data: order });
});

// POST /api/payments/webhook — safety net for when the client never calls
// /verify (tab closed mid-flow, network drop, etc). Unauthenticated by
// design: the signature over the raw body IS the authentication.
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const valid = verifyWebhookSignature({ rawBody: req.rawBody, signature });
  if (!valid) return res.status(400).json({ success: false, message: 'Invalid signature' });

  const event = req.body?.event;
  const entity = req.body?.payload?.payment?.entity;

  if (event === 'payment.captured' && entity?.order_id) {
    await finalizeByRazorpayOrderId({
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
      method: entity.method || null,
      // eslint-disable-next-line no-console
    }).catch((err) => console.error('webhook payment.captured finalize failed:', err.message));
  } else if (event === 'payment.failed' && entity?.order_id) {
    const attempt = await paymentsDb.getPaymentAttemptByRazorpayOrderId(entity.order_id);
    if (attempt && attempt.status === 'created') {
      await paymentsDb.markPaymentAttemptFailed(attempt.id, entity.error_description || 'Payment failed');
    }
  }

  // Always 200 once the signature checks out — Razorpay retries non-2xx
  // responses, and a business-logic failure above is already recorded.
  res.status(200).json({ success: true });
});
