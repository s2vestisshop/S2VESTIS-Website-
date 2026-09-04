import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

if (!env.razorpay.keyId || !env.razorpay.keySecret) {
  throw new Error(
    'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required — copy server/.env.example to .env and fill them in from your Razorpay dashboard (Settings → API Keys). Use test-mode keys for local development.'
  );
}

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Creates a Razorpay Order. `amountRupees` is converted to paise here — the
 * only place in the app that conversion happens. */
export async function createRazorpayOrder({ amountRupees, receipt }) {
  return razorpay.orders.create({
    amount: Math.round(amountRupees * 100),
    currency: 'INR',
    receipt,
  });
}

/** Verifies the signature Razorpay Checkout hands back after a successful payment. */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqualHex(expected, razorpaySignature);
}

/** Verifies the `X-Razorpay-Signature` header on an incoming webhook against the raw body bytes. */
export function verifyWebhookSignature({ rawBody, signature }) {
  if (!env.razorpay.webhookSecret || !rawBody || typeof signature !== 'string') return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  return safeEqualHex(expected, signature);
}

/** Best-effort lookup of how a payment was made (card/upi/netbanking/wallet), for the order record. */
export async function fetchPaymentMethod(paymentId) {
  const payment = await razorpay.payments.fetch(paymentId);
  return payment?.method || null;
}

export default razorpay;
