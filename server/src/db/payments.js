import { supabase, assertNoError } from '../config/supabase.js';

const ATTEMPT_SELECT =
  'id, razorpay_order_id, razorpay_payment_id, amount, currency, address, coupon_code, cart_id, user_id, status, order_id';

function mapAttempt(row) {
  if (!row) return null;
  return {
    id: row.id,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id ?? null,
    amount: Number(row.amount),
    currency: row.currency,
    address: row.address,
    couponCode: row.coupon_code,
    cartId: row.cart_id,
    userId: row.user_id,
    status: row.status,
    orderId: row.order_id ?? null,
  };
}

/** Read-only pricing preview — same formula place_order() uses, without locking stock. */
export async function quoteCart({ cartId, userId, couponCode }) {
  const { data, error } = await supabase.rpc('quote_cart', {
    p_cart_id: cartId,
    p_user_id: userId,
    p_coupon_code: couponCode || null,
  });
  assertNoError(error, 'quoteCart');
  return data?.[0] ?? null;
}

export async function createPaymentAttempt({ userId, cartId, razorpayOrderId, amount, couponCode, address }) {
  const { data, error } = await supabase
    .from('payment_attempts')
    .insert({
      user_id: userId,
      cart_id: cartId,
      razorpay_order_id: razorpayOrderId,
      amount,
      coupon_code: couponCode || null,
      address,
    })
    .select(ATTEMPT_SELECT)
    .single();
  assertNoError(error, 'createPaymentAttempt');
  return mapAttempt(data);
}

export async function getPaymentAttemptByRazorpayOrderId(razorpayOrderId) {
  const { data, error } = await supabase
    .from('payment_attempts')
    .select(ATTEMPT_SELECT)
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle();
  assertNoError(error, 'getPaymentAttemptByRazorpayOrderId');
  return mapAttempt(data);
}

/**
 * Atomically "claims" an attempt for finalizing. The conditional
 * `.eq('status', 'created')` compiles to a single UPDATE...WHERE...RETURNING,
 * which is atomic under Postgres row locking — so if the client-side
 * /verify call and the Razorpay webhook both race to finalize the same
 * payment, exactly one of them gets a row back and proceeds.
 */
export async function claimPaymentAttempt({ razorpayOrderId, razorpayPaymentId }) {
  const { data, error } = await supabase
    .from('payment_attempts')
    .update({ razorpay_payment_id: razorpayPaymentId, status: 'paid' })
    .eq('razorpay_order_id', razorpayOrderId)
    .eq('status', 'created')
    .select(ATTEMPT_SELECT)
    .maybeSingle();
  assertNoError(error, 'claimPaymentAttempt');
  return mapAttempt(data);
}

export async function markPaymentAttemptFailed(id, reason) {
  const { error } = await supabase
    .from('payment_attempts')
    .update({ status: 'failed', failure_reason: reason })
    .eq('id', id);
  assertNoError(error, 'markPaymentAttemptFailed');
}

export async function linkOrderToAttempt(id, orderId) {
  const { error } = await supabase.from('payment_attempts').update({ order_id: orderId }).eq('id', id);
  assertNoError(error, 'linkOrderToAttempt');
}
