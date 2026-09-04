import { supabase, assertNoError } from '../config/supabase.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toArrayParam = (v) => {
  if (v == null || v === '') return null;
  const arr = Array.isArray(v) ? v : String(v).split(',');
  const cleaned = arr.map((s) => String(s).trim()).filter(Boolean);
  return cleaned.length ? cleaned : null;
};

/** GET /api/products — public gallery, paginated. */
export async function listProducts({
  category,
  gender,
  search,
  minPrice,
  maxPrice,
  size,
  color,
  ids,
  featured,
  sort = 'newest',
  page = 1,
  limit = 12,
}) {
  const idList = ids !== undefined ? toArrayParam(ids)?.filter((v) => UUID_RE.test(v)) ?? [] : null;

  const { data, error } = await supabase.rpc('list_products', {
    p_category_slug: category || null,
    p_gender: gender || null,
    p_search: search || null,
    p_min_price: minPrice ?? null,
    p_max_price: maxPrice ?? null,
    p_sizes: toArrayParam(size),
    p_colors: toArrayParam(color),
    p_ids: idList,
    p_featured: featured === undefined ? null : featured,
    p_sort: sort,
    p_page: page,
    p_limit: limit,
  });
  assertNoError(error, 'listProducts');

  const total = data?.[0]?.total ? Number(data[0].total) : 0;
  const perPage = Math.min(Number(limit) || 12, 60);
  const currentPage = Math.max(Number(page) || 1, 1);
  const items = (data ?? []).map((row) => row.item);

  return {
    items,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1,
      hasNextPage: (currentPage - 1) * perPage + items.length < total,
    },
  };
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase.rpc('get_product_detail', { p_slug: slug });
  assertNoError(error, 'getProductBySlug');
  return data ?? null;
}

export async function getRelatedProducts(slug, limit = 8) {
  const { data, error } = await supabase.rpc('related_products', { p_slug: slug, p_limit: limit });
  assertNoError(error, 'getRelatedProducts');
  return data ?? [];
}

export async function adminListProducts({ search, category, status, page = 1, limit = 20 }) {
  const { data, error } = await supabase.rpc('admin_list_products', {
    p_search: search || null,
    p_category_id: category || null,
    p_status: status || null,
    p_page: page,
    p_limit: limit,
  });
  assertNoError(error, 'adminListProducts');

  const total = data?.[0]?.total ? Number(data[0].total) : 0;
  const perPage = Math.min(Number(limit) || 20, 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  return {
    items: (data ?? []).map((row) => row.item),
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1,
    },
  };
}

export async function adminGetProductById(id) {
  const { data, error } = await supabase.rpc('admin_get_product', { p_id: id });
  assertNoError(error, 'adminGetProductById');
  return data ?? null;
}

export async function adminCreateProduct(payload) {
  const { data, error } = await supabase.rpc('admin_create_product', { p_payload: payload });
  assertNoError(error, 'adminCreateProduct');
  return data;
}

export async function adminUpdateProduct(id, payload) {
  const { data, error } = await supabase.rpc('admin_update_product', {
    p_id: id,
    p_payload: payload,
  });
  assertNoError(error, 'adminUpdateProduct');
  return data;
}

export async function adminDeleteProduct(id) {
  const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
  assertNoError(error, 'adminDeleteProduct');
  return (data?.length ?? 0) > 0;
}

export async function categoryExists(id) {
  const { count, error } = await supabase
    .from('categories')
    .select('id', { head: true, count: 'exact' })
    .eq('id', id);
  assertNoError(error, 'categoryExists');
  return (count || 0) > 0;
}

/**
 * For cart operations: locate a product's colour variant, then the size row
 * within it. Returns `{ variant, sizeRow }` — either may be null, mirroring
 * the old two-step "colour not available" vs "size not available" checks.
 */
export async function findVariantAndSize(productId, color, size) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, color, color_hex, variant_sizes(id, size, stock)')
    .eq('product_id', productId)
    .ilike('color', color);
  assertNoError(error, 'findVariantAndSize');

  const variant = data?.[0];
  if (!variant) return { variant: null, sizeRow: null };

  const sizeRow = variant.variant_sizes.find(
    (s) => s.size.toLowerCase() === String(size).toLowerCase()
  );
  return {
    variant: { id: variant.id, color: variant.color },
    sizeRow: sizeRow ? { variantSizeId: sizeRow.id, size: sizeRow.size, stock: sizeRow.stock } : null,
  };
}

/** Product must exist and be active + return its effective price (used by cart add). */
export async function getActiveProductPrice(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, effective_price, is_active')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();
  assertNoError(error, 'getActiveProductPrice');
  return data;
}
