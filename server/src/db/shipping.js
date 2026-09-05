import { supabase, assertNoError } from '../config/supabase.js';

/* -------------------------- cached provider tokens ------------------------- */

export async function getToken(provider) {
  const { data, error } = await supabase
    .from('integration_tokens')
    .select('token, expires_at')
    .eq('provider', provider)
    .maybeSingle();
  assertNoError(error, 'getToken');
  return data ? { token: data.token, expiresAt: data.expires_at } : null;
}

export async function saveToken(provider, token, expiresAt) {
  const { error } = await supabase.from('integration_tokens').upsert({
    provider,
    token,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });
  assertNoError(error, 'saveToken');
}

/* ------------------------------ shipment state ------------------------------ */

/** Records that a Shiprocket order/shipment now exists for one of our orders. */
export async function recordShipmentCreated(orderId, { shiprocketOrderId, shiprocketShipmentId, estimatedDeliveryDate }) {
  const { error } = await supabase
    .from('orders')
    .update({
      shiprocket_order_id: shiprocketOrderId,
      shiprocket_shipment_id: shiprocketShipmentId,
      estimated_delivery_date: estimatedDeliveryDate,
    })
    .eq('id', orderId);
  assertNoError(error, 'recordShipmentCreated');
}

// Only these three normalized statuses move the order's headline status and
// stamp a timestamp column — everything else (AWB assigned, picked up, RTO,
// ...) still gets logged to shipment_events but doesn't touch `orders.status`.
const MILESTONE_COLUMN = {
  shipped: 'shipped_at',
  out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at',
};

/** Applies one webhook (or admin-logged) shipment update: always logs the
 * event, and for a tracked milestone also stamps the order's headline
 * status/timestamp + any AWB/courier/tracking info that came with it. */
export async function recordShipmentEvent({
  orderId,
  status,
  description,
  occurredAt,
  rawPayload,
  awbCode,
  courierName,
  trackingUrl,
}) {
  const { error: evErr } = await supabase.from('shipment_events').insert({
    order_id: orderId,
    status,
    description,
    occurred_at: occurredAt,
    raw_payload: rawPayload ?? null,
  });
  assertNoError(evErr, 'recordShipmentEvent:insert');

  const patch = {};
  const column = MILESTONE_COLUMN[status];
  if (column) {
    patch.status = status;
    patch[column] = occurredAt;
  }
  if (awbCode) patch.awb_code = awbCode;
  if (courierName) patch.courier_name = courierName;
  if (trackingUrl) patch.tracking_url = trackingUrl;

  if (Object.keys(patch).length > 0) {
    const { error: updErr } = await supabase.from('orders').update(patch).eq('id', orderId);
    assertNoError(updErr, 'recordShipmentEvent:update');
  }
}

export async function findOrderByOrderNumber(orderNumber) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('order_number', orderNumber)
    .maybeSingle();
  assertNoError(error, 'findOrderByOrderNumber');
  return data ? { id: data.id, userId: data.user_id } : null;
}

export async function findOrderByShiprocketOrderId(shiprocketOrderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('shiprocket_order_id', String(shiprocketOrderId))
    .maybeSingle();
  assertNoError(error, 'findOrderByShiprocketOrderId');
  return data ? { id: data.id, userId: data.user_id } : null;
}
