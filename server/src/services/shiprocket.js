import { env, isShiprocketConfigured } from '../config/env.js';
import * as shippingDb from '../db/shipping.js';

// NOTE: written against Shiprocket's documented Adhoc Order / auth / courier
// serviceability API. Not exercised against a live Shiprocket account by
// this change (no credentials available while writing it) — verify field
// names against a real response the first time you use it, and check their
// current API docs if a call comes back with an unexpected 4xx.
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const TOKEN_TTL_DAYS = 9; // Shiprocket tokens last ~10 days; refresh a day early
const DEFAULT_WEIGHT_KG_PER_ITEM = 0.3;

let cachedToken = null; // { token, expiresAt: Date } — fast path within a warm process

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.shiprocket.email, password: env.shiprocket.password }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.token) {
    throw new Error(`Shiprocket login failed: ${body?.message || res.status}`);
  }
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await shippingDb.saveToken('shiprocket', body.token, expiresAt);
  cachedToken = { token: body.token, expiresAt };
  return cachedToken.token;
}

/** Two-tier cache: in-memory first (fast path in a warm process), then the
 * `integration_tokens` DB row (survives Render free-tier restarts/sleeps),
 * only calling Shiprocket's login endpoint when both are stale. */
async function getToken() {
  if (cachedToken && cachedToken.expiresAt > new Date()) return cachedToken.token;

  const stored = await shippingDb.getToken('shiprocket');
  if (stored && new Date(stored.expiresAt) > new Date()) {
    cachedToken = { token: stored.token, expiresAt: new Date(stored.expiresAt) };
    return cachedToken.token;
  }

  return login();
}

async function shiprocketFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Shiprocket API error (${res.status}): ${body?.message || 'unknown error'}`);
  }
  return body;
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') || '.' };
}

async function fetchEstimatedDelivery(deliveryPincode, weight) {
  if (!env.shiprocket.pickupPincode) return null;
  const params = new URLSearchParams({
    pickup_postcode: env.shiprocket.pickupPincode,
    delivery_postcode: deliveryPincode,
    weight: String(weight),
    cod: '0',
  });
  const result = await shiprocketFetch(`/courier/serviceability/?${params}`);
  const courier = result?.data?.available_courier_companies?.[0];
  return courier?.etd || null;
}

/**
 * Creates a Shiprocket adhoc order for a just-paid S2VESTIS order. Payment
 * is always reported as 'Prepaid' — Razorpay has already captured the money
 * by the time this runs. AWB/courier assignment is left to the Shiprocket
 * dashboard (not auto-assigned here) — see the Phase 11 plan notes. Never
 * throws in a way that should surprise the caller: it's expected to be
 * wrapped in try/catch so a Shiprocket hiccup never blocks an order that's
 * already been paid for (see paymentController.js's finalize flow and the
 * admin "retry shipment creation" action).
 */
export async function createShipmentOrder(order) {
  if (!isShiprocketConfigured) {
    throw new Error(
      'Shiprocket is not configured (SHIPROCKET_EMAIL/PASSWORD/PICKUP_LOCATION missing)'
    );
  }

  const { first, last } = splitName(order.address?.fullName);
  const weight = Math.max(0.5, DEFAULT_WEIGHT_KG_PER_ITEM * order.itemCount);

  const payload = {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' '),
    pickup_location: env.shiprocket.pickupLocation,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: order.address?.line1,
    billing_address_2: order.address?.line2 || '',
    billing_city: order.address?.city,
    billing_pincode: order.address?.postalCode,
    billing_state: order.address?.state || '',
    billing_country: 'India',
    billing_email: order.customerEmail,
    billing_phone: order.address?.phone,
    shipping_is_billing: true,
    order_items: order.items.map((it) => ({
      name: it.name,
      sku: `${it.slug}-${it.color}-${it.size}`.slice(0, 50),
      units: it.quantity,
      selling_price: it.price,
    })),
    payment_method: 'Prepaid',
    sub_total: order.total,
    length: 20,
    breadth: 15,
    height: 5,
    weight,
  };

  const result = await shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  let estimatedDeliveryDate = null;
  try {
    estimatedDeliveryDate = await fetchEstimatedDelivery(order.address?.postalCode, weight);
  } catch {
    // Best-effort — a missing ETA (serviceability lookup failing) never
    // blocks shipment creation itself.
  }

  return {
    shiprocketOrderId: String(result?.order_id ?? ''),
    shiprocketShipmentId: String(result?.shipment_id ?? ''),
    estimatedDeliveryDate,
  };
}

/** Simple shared-secret check for the inbound status webhook — Shiprocket's
 * webhook auth is a header value configured in their dashboard, not an
 * HMAC signature, so a plain string compare is enough. */
export function verifyWebhookToken(headerValue) {
  return Boolean(env.shiprocket.webhookToken) && headerValue === env.shiprocket.webhookToken;
}
