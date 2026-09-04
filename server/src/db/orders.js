import { supabase, assertNoError } from '../config/supabase.js';

const ORDER_SELECT =
  'id, order_number, status, item_count, total, created_at, order_items(product_id, name, slug, image_url, color, size, quantity, unit_price)';

function mapOrder(row) {
  if (!row) return null;
  return {
    _id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    itemCount: row.item_count,
    total: Number(row.total),
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
  };
}

/**
 * Places a demo order from the user's current cart (atomic — see
 * public.place_order in Supabase). Throws with `.pgMessage` prefixes:
 * EMPTY_CART / INSUFFICIENT_STOCK:<name>:<size> / INVALID_COUPON:<msg>.
 */
export async function placeOrder(userId, cartId, { couponCode = null, address = null } = {}) {
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_cart_id: cartId,
    p_user_id: userId,
    p_coupon_code: couponCode,
    p_address: address,
  });
  assertNoError(error, 'placeOrder');
  return getMyOrder(userId, orderId);
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
