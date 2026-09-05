import { supabase, assertNoError } from '../config/supabase.js';

const ORDER_SELECT = `
  id, order_number, status, item_count, total, address, payment_method, paid_at,
  payment_review_required, awb_code, courier_name, tracking_url,
  shipped_at, out_for_delivery_at, delivered_at, estimated_delivery_date, created_at,
  order_items(product_id, name, slug, image_url, color, size, quantity, unit_price),
  shipment_events(status, description, occurred_at)
`;

function mapOrder(row) {
  if (!row) return null;
  return {
    _id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    itemCount: row.item_count,
    total: Number(row.total),
    address: row.address ?? null,
    paymentMethod: row.payment_method ?? null,
    paidAt: row.paid_at ?? null,
    paymentReviewRequired: row.payment_review_required ?? false,
    awbCode: row.awb_code ?? null,
    courierName: row.courier_name ?? null,
    trackingUrl: row.tracking_url ?? null,
    shippedAt: row.shipped_at ?? null,
    outForDeliveryAt: row.out_for_delivery_at ?? null,
    deliveredAt: row.delivered_at ?? null,
    estimatedDeliveryDate: row.estimated_delivery_date ?? null,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((it) => ({
      product: it.product_id,
      name: it.name,
      slug: it.slug,
      image: it.image_url,
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      price: Number(it.unit_price),
    })),
    events: (row.shipment_events ?? [])
      .slice()
      .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
      .map((ev) => ({ status: ev.status, description: ev.description, occurredAt: ev.occurred_at })),
  };
}

/**
 * Places an order from the user's current cart (atomic — see
 * public.place_order in Supabase). Only called from paymentController's
 * post-payment-verification flow now: passing razorpayPaymentId/paymentMethod
 * is what flips the resulting order to status 'paid' with paid_at set, instead
 * of the old demo-only 'demo-placed'. Throws with message prefixes:
 * EMPTY_CART / INSUFFICIENT_STOCK:<name>:<size> / INVALID_COUPON:<msg>.
 */
export async function placeOrder(
  userId,
  cartId,
  {
    couponCode = null,
    address = null,
    razorpayOrderId = null,
    razorpayPaymentId = null,
    paymentMethod = null,
  } = {}
) {
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_cart_id: cartId,
    p_user_id: userId,
    p_coupon_code: couponCode,
    p_address: address,
    p_razorpay_order_id: razorpayOrderId,
    p_razorpay_payment_id: razorpayPaymentId,
    p_payment_method: paymentMethod,
  });
  assertNoError(error, 'placeOrder');
  return getMyOrder(userId, orderId);
}

/** Flags an order for manual admin review (e.g. the amount Razorpay actually
 * captured doesn't quite match what place_order computed). Never blocks the
 * customer — this just leaves a breadcrumb. */
export async function flagPaymentReview(orderId, note) {
  const { error } = await supabase
    .from('orders')
    .update({ payment_review_required: true, payment_review_note: note })
    .eq('id', orderId);
  assertNoError(error, 'flagPaymentReview');
}

export async function listMyOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  assertNoError(error, 'listMyOrders');
  return (data ?? []).map(mapOrder);
}

export async function getMyOrder(userId, orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', userId)
    .eq('id', orderId)
    .maybeSingle();
  assertNoError(error, 'getMyOrder');
  return mapOrder(data);
}
