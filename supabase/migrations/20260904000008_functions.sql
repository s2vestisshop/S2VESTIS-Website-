-- 0008 — RPC functions the API calls: search, coupons, cart merge, order placement
-- All are SECURITY DEFINER with a pinned search_path; the API invokes them with
-- the service-role key.

-- ---------------------------------------------------------------------------
-- Full-text + fuzzy product search, relevance-ranked.
-- ---------------------------------------------------------------------------
create or replace function public.search_products(
  p_query  text,
  p_limit  integer default 24,
  p_offset integer default 0
)
returns setof public.products
language sql
stable
security definer
set search_path = public
as $$
  with q as (select websearch_to_tsquery('simple', coalesce(p_query, '')) as tsq)
  select p.*
  from public.products p, q
  where p.is_active
    and (
      (q.tsq is not null and p.search_tsv @@ q.tsq)
      or p.name ilike '%' || coalesce(p_query, '') || '%'
      or similarity(p.name, coalesce(p_query, '')) > 0.2
    )
  order by
    ts_rank(p.search_tsv, q.tsq) desc nulls last,
    similarity(p.name, coalesce(p_query, '')) desc,
    p.rating_avg desc,
    p.created_at desc
  limit greatest(1, least(p_limit, 60))
  offset greatest(0, p_offset);
$$;

-- Count for the same predicate (pagination).
create or replace function public.search_products_count(p_query text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with q as (select websearch_to_tsquery('simple', coalesce(p_query, '')) as tsq)
  select count(*)::int
  from public.products p, q
  where p.is_active
    and (
      (q.tsq is not null and p.search_tsv @@ q.tsq)
      or p.name ilike '%' || coalesce(p_query, '') || '%'
      or similarity(p.name, coalesce(p_query, '')) > 0.2
    );
$$;

-- ---------------------------------------------------------------------------
-- Autocomplete suggestions (product names + matching categories).
-- ---------------------------------------------------------------------------
create or replace function public.search_suggestions(
  p_query text,
  p_limit integer default 8
)
returns table (label text, kind text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  (
    select p.name, 'product'::text, p.slug
    from public.products p
    where p.is_active
      and (p.name ilike '%' || p_query || '%' or similarity(p.name, p_query) > 0.2)
    order by similarity(p.name, p_query) desc, p.rating_avg desc
    limit greatest(1, least(p_limit, 12))
  )
  union all
  (
    select c.name, 'category'::text, c.slug
    from public.categories c
    where c.is_active and c.name ilike '%' || p_query || '%'
    limit 3
  );
$$;

-- ---------------------------------------------------------------------------
-- Coupon check. Returns validity + the discount it would apply to p_subtotal.
-- ---------------------------------------------------------------------------
create or replace function public.validate_coupon(
  p_code     text,
  p_subtotal numeric,
  p_user_id  uuid default null
)
returns table (valid boolean, discount numeric, message text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  d numeric(12,2) := 0;
  used_by_user integer := 0;
begin
  select * into c from public.coupons where code = lower(p_code);

  if not found or not c.is_active then
    return query select false, 0::numeric, 'This code is not valid.'; return;
  end if;
  if c.starts_at is not null and c.starts_at > now() then
    return query select false, 0::numeric, 'This code is not active yet.'; return;
  end if;
  if c.expires_at is not null and c.expires_at <= now() then
    return query select false, 0::numeric, 'This code has expired.'; return;
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select false, 0::numeric, 'This code has been fully redeemed.'; return;
  end if;
  if p_subtotal < c.min_subtotal then
    return query select false, 0::numeric,
      'Spend at least ' || c.min_subtotal::text || ' to use this code.'; return;
  end if;
  if c.per_user_limit is not null and p_user_id is not null then
    select count(*) into used_by_user
    from public.coupon_redemptions r where r.coupon_id = c.id and r.user_id = p_user_id;
    if used_by_user >= c.per_user_limit then
      return query select false, 0::numeric, 'You have already used this code.'; return;
    end if;
  end if;

  if c.discount_type = 'percent' then
    d := round(p_subtotal * c.discount_value / 100, 2);
  else
    d := c.discount_value;
  end if;
  if c.max_discount is not null then d := least(d, c.max_discount); end if;
  d := least(d, p_subtotal);

  return query select true, d, 'Code applied.';
end;
$$;

-- ---------------------------------------------------------------------------
-- Merge a guest cart into a user's cart (on login / register).
-- Same variant+size lines have quantities summed, capped at 99. The guest
-- cart is deleted.
-- ---------------------------------------------------------------------------
create or replace function public.merge_guest_cart(
  p_guest_token text,
  p_user_id     uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g_cart uuid;
  u_cart uuid;
begin
  if p_guest_token is null then return; end if;

  select id into g_cart from public.carts where guest_token = p_guest_token;
  if g_cart is null then return; end if;

  select id into u_cart from public.carts where user_id = p_user_id;
  if u_cart is null then
    insert into public.carts (user_id) values (p_user_id) returning id into u_cart;
  end if;

  insert into public.cart_items (cart_id, variant_size_id, quantity, price_at_add)
  select u_cart, gi.variant_size_id, gi.quantity, gi.price_at_add
  from public.cart_items gi
  where gi.cart_id = g_cart
  on conflict (cart_id, variant_size_id) do update
    set quantity = least(cart_items.quantity + excluded.quantity, 99);

  delete from public.carts where id = g_cart;   -- cascades to its items
end;
$$;

-- ---------------------------------------------------------------------------
-- Place a DEMO order: validate + decrement stock, snapshot items, apply a
-- coupon, record the redemption, clear the cart, queue a confirmation email —
-- all in one transaction. Raises P0001 with a machine-readable prefix on
-- failure (EMPTY_CART, INSUFFICIENT_STOCK:<name>:<size>, INVALID_COUPON, …).
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_cart_id     uuid,
  p_user_id     uuid,
  p_coupon_code text default null,
  p_address     jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id   uuid;
  v_order_num  text;
  v_subtotal   numeric(12,2) := 0;
  v_discount   numeric(12,2) := 0;
  v_shipping   numeric(12,2) := 0;
  v_total      numeric(12,2);
  v_count      integer := 0;
  v_coupon     public.coupons%rowtype;
  v_chk        record;
  it           record;
begin
  -- lock the affected stock rows and validate
  for it in
    select ci.quantity,
           vs.id as vs_id, vs.size, vs.stock,
           pv.color,
           p.id as product_id, p.name, p.slug, p.effective_price,
           (select vi.url from public.variant_images vi
             where vi.variant_id = pv.id order by vi.position limit 1) as image_url
    from public.cart_items ci
    join public.variant_sizes vs   on vs.id = ci.variant_size_id
    join public.product_variants pv on pv.id = vs.variant_id
    join public.products p          on p.id = pv.product_id
    where ci.cart_id = p_cart_id
    for update of vs
  loop
    if it.quantity > it.stock then
      raise exception 'INSUFFICIENT_STOCK:%:%', it.name, it.size using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + it.effective_price * it.quantity;
    v_count    := v_count + it.quantity;
  end loop;

  if v_count = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  -- coupon
  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_chk from public.validate_coupon(p_coupon_code, v_subtotal, p_user_id);
    if not v_chk.valid then
      raise exception 'INVALID_COUPON:%', v_chk.message using errcode = 'P0001';
    end if;
    v_discount := v_chk.discount;
    select * into v_coupon from public.coupons where code = lower(p_coupon_code);
  end if;

  -- shipping: free over 1999 (after discount), else flat 99
  v_shipping := case when (v_subtotal - v_discount) >= 1999 then 0 else 99 end;
  v_total    := v_subtotal - v_discount + v_shipping;
  v_order_num := 'S2V-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  insert into public.orders
    (user_id, order_number, status, subtotal, discount_total, shipping_total,
     total, item_count, coupon_code, address, placed_at)
  values
    (p_user_id, v_order_num, 'demo-placed', v_subtotal, v_discount, v_shipping,
     v_total, v_count, nullif(lower(coalesce(p_coupon_code, '')), ''), p_address, now())
  returning id into v_order_id;

  -- snapshot lines + decrement stock
  for it in
    select ci.quantity,
           vs.id as vs_id, vs.size,
           pv.color,
           p.id as product_id, p.name, p.slug, p.effective_price,
           (select vi.url from public.variant_images vi
             where vi.variant_id = pv.id order by vi.position limit 1) as image_url
    from public.cart_items ci
    join public.variant_sizes vs   on vs.id = ci.variant_size_id
    join public.product_variants pv on pv.id = vs.variant_id
    join public.products p          on p.id = pv.product_id
    where ci.cart_id = p_cart_id
  loop
    insert into public.order_items
      (order_id, product_id, variant_size_id, name, slug, image_url,
       color, size, unit_price, quantity, line_total)
    values
      (v_order_id, it.product_id, it.vs_id, it.name, it.slug, it.image_url,
       it.color, it.size, it.effective_price, it.quantity,
       it.effective_price * it.quantity);

    update public.variant_sizes set stock = stock - it.quantity where id = it.vs_id;
  end loop;

  -- coupon accounting
  if v_coupon.id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
    insert into public.coupon_redemptions (coupon_id, user_id, order_id, amount)
    values (v_coupon.id, p_user_id, v_order_id, v_discount);
  end if;

  -- clear the cart
  delete from public.cart_items where cart_id = p_cart_id;

  -- queue the confirmation email
  insert into public.email_outbox (to_email, template, payload)
  select u.email, 'order_confirmation',
         jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_num, 'total', v_total)
  from public.users u where u.id = p_user_id;

  return v_order_id;
end;
$$;
