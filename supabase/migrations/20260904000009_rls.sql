-- 0009 — Row Level Security
--
-- The Express API talks to the database with the service-role key, which
-- bypasses RLS. These policies are a safety net so that if a table is ever
-- exposed to a `supabase-js` client with the anon/authenticated key, only
-- public catalog data is readable and nothing is writable.

-- Enable RLS on every public table. (service_role and the migration owner have
-- BYPASSRLS, so the Express API and the seed are unaffected; anon / authenticated
-- are gated by the policies below.)
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ---- public, read-only catalog --------------------------------------
create policy "catalog: read active categories"
  on public.categories for select to anon, authenticated
  using (is_active);

create policy "catalog: read active products"
  on public.products for select to anon, authenticated
  using (is_active);

create policy "catalog: read variants of active products"
  on public.product_variants for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.is_active
  ));

create policy "catalog: read variant images"
  on public.variant_images for select to anon, authenticated
  using (exists (
    select 1
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = variant_images.variant_id and p.is_active
  ));

create policy "catalog: read variant sizes"
  on public.variant_sizes for select to anon, authenticated
  using (exists (
    select 1
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = variant_sizes.variant_id and p.is_active
  ));

create policy "reviews: read approved"
  on public.reviews for select to anon, authenticated
  using (is_approved);

-- Every other table: RLS enabled, no policy → denied for anon/authenticated.
-- (service_role bypasses RLS, so the Express API is unaffected.)

-- ---- function execution ------------------------------------------
-- Read-only helpers stay callable by everyone.
grant execute on function
  public.search_products(text, integer, integer),
  public.search_products_count(text),
  public.search_suggestions(text, integer),
  public.validate_coupon(text, numeric, uuid)
to anon, authenticated, service_role;

-- Mutating / privileged routines: service-role only.
revoke execute on function public.place_order(uuid, uuid, text, jsonb)      from anon, authenticated;
revoke execute on function public.merge_guest_cart(text, uuid)             from anon, authenticated;
revoke execute on function public.purge_expired_auth_tokens()             from anon, authenticated;
revoke execute on function public.recompute_product_rating(uuid)          from anon, authenticated;
grant execute on function
  public.place_order(uuid, uuid, text, jsonb),
  public.merge_guest_cart(text, uuid),
  public.purge_expired_auth_tokens(),
  public.recompute_product_rating(uuid)
to service_role;
