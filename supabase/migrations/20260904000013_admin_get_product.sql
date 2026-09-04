-- 0013 — single-product-by-id lookup for the admin edit form (includes inactive).

create or replace function public.admin_get_product(p_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select public.product_json(p) from public.products p where p.id = p_id;
$$;

revoke execute on function public.admin_get_product(uuid) from public, anon, authenticated;
grant execute on function public.admin_get_product(uuid) to service_role;
