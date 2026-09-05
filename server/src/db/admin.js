import { supabase, assertNoError } from '../config/supabase.js';

export async function adminStats() {
  const { data, error } = await supabase.rpc('admin_stats');
  assertNoError(error, 'adminStats');
  return data;
}

export async function adminListOrders({ search, status, page = 1, limit = 20 }) {
  const { data, error } = await supabase.rpc('admin_list_orders', {
    p_search: search || null,
    p_status: status || null,
    p_page: page,
    p_limit: limit,
  });
  assertNoError(error, 'adminListOrders');

  const total = data?.[0]?.total ? Number(data[0].total) : 0;
  const perPage = Math.min(Number(limit) || 20, 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  return {
    items: (data ?? []).map((row) => row.item),
    pagination: { page: currentPage, limit: perPage, total, pages: Math.ceil(total / perPage) || 1 },
  };
}

export async function adminGetOrder(id) {
  const { data, error } = await supabase.rpc('admin_get_order', { p_id: id });
  assertNoError(error, 'adminGetOrder');
  return data ?? null;
}

export async function adminUpdateOrderStatus(id, status, note) {
  const { data, error } = await supabase.rpc('admin_update_order_status', {
    p_id: id,
    p_status: status,
    p_note: note || null,
  });
  assertNoError(error, 'adminUpdateOrderStatus');
  return data;
}
