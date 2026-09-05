-- 0022 (2026-09-05) — admin_stats() called its order count "demoOrders" from
-- back when every order was a demo order. Orders are real now (Phase 10) —
-- rename the field so the admin dashboard doesn't call real revenue "demo".
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_total_products int; v_active_products int; v_total_categories int;
  v_total_users int; v_total_orders int; v_low_stock jsonb;
begin
  select count(*) into v_total_products from public.products;
  select count(*) into v_active_products from public.products where is_active;
  select count(*) into v_total_categories from public.categories;
  select count(*) into v_total_users from public.users;
  select count(*) into v_total_orders from public.orders;

  select coalesce(jsonb_agg(jsonb_build_object(
      '_id', x.id, 'name', x.name, 'slug', x.slug, 'stock', x.stock
    ) order by x.stock asc), '[]'::jsonb)
  into v_low_stock
  from (
    select p.id, p.name, p.slug, sum(vs.stock) as stock
    from public.products p
    join public.product_variants v on v.product_id = p.id
    join public.variant_sizes vs on vs.variant_id = v.id
    group by p.id, p.name, p.slug
    having sum(vs.stock) <= 5
    order by sum(vs.stock) asc
    limit 20
  ) x;

  return jsonb_build_object(
    'totalProducts', v_total_products,
    'activeProducts', v_active_products,
    'inactiveProducts', v_total_products - v_active_products,
    'totalCategories', v_total_categories,
    'totalUsers', v_total_users,
    'totalOrders', v_total_orders,
    'lowStockThreshold', 5,
    'lowStockCount', jsonb_array_length(v_low_stock),
    'lowStock', v_low_stock
  );
end;
$$;
