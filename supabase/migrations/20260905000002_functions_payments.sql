-- 0017 (2026-09-05) — quote_cart() + place_order() refactored for real payments.
--
-- quote_cart() is a NEW, read-only preview: same subtotal/coupon/shipping
-- formula place_order() has always used, extracted so the payments controller
-- can size a Razorpay order correctly *before* place_order() itself runs (it
-- now runs later, only once payment is confirmed — see paymentController.js).
-- Extracting it here means the pricing formula exists in exactly one place;
-- place_order() below calls it instead of duplicating the math.
create or replace function public.quote_cart(
  p_cart_id     uuid,
  p_user_id     uuid,
  p_coupon_code text default null
)
returns table (
  subtotal       numeric(12,2),
  discount_total numeric(12,2),
  shipping_total numeric(12,2),
  total          numeric(12,2),
  item_count     integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_count    integer := 0;
  v_chk      record;
  it         record;
begin
  -- Preview only — no `for update`. place_order() re-validates stock under
  -- lock for real; this is just for pricing/display and sizing a charge.
  for it in
    select ci.quantity, vs.stock, vs.size, p.name, p.effective_price
    from public.cart_items ci
    join public.variant_sizes vs    on vs.id = ci.variant_size_id
    join public.product_variants pv on pv.id = vs.variant_id
    join public.products p          on p.id = pv.product_id
    where ci.cart_id = p_cart_id
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

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_chk from public.validate_coupon(p_coupon_code, v_subtotal, p_user_id);
    if not v_chk.valid then
      raise exception 'INVALID_COUPON:%', v_chk.message using errcode = 'P0001';
    end if;
    v_discount := v_chk.discount;
  end if;

  -- shipping: free over 1999 (after discount), else flat 99 — identical to
  -- place_order()'s original formula.
  v_shipping := case when (v_subtotal - v_discount) >= 1999 then 0 else 99 end;

  return query select v_subtotal, v_discount, v_shipping,
                      v_subtotal - v_discount + v_shipping, v_count;
end;
$$;

-- Parameter list is changing (3 new trailing params) — `create or replace`
-- does NOT replace a function whose signature changed, it would just add a
-- second overload and leave this stale 4-arg version reachable. Drop it first.
drop function if exists public.place_order(uuid, uuid, text, jsonb);

-- Place a real order: validate + decrement stock, snapshot items, apply a
-- coupon, record the redemption, clear the cart, queue a confirmation email —
-- all in one transaction. When called with Razorpay payment info (from the
-- payments controller, only after signature verification), the order is
-- inserted as 'paid' with paid_at set; the old no-payment call shape still
-- works and still produces 'demo-placed' (kept for the smoke/seed scripts,
-- not reachable from any HTTP route anymore). Raises P0001 with a
-- machine-readable prefix on failure (EMPTY_CART, INSUFFICIENT_STOCK:<name>:<size>,
-- INVALID_COUPON:<msg>) — unchanged from before, since quote_cart() raises
-- the identical exceptions.
create or replace function public.place_order(
  p_cart_id             uuid,
  p_user_id             uuid,
  p_coupon_code         text default null,
  p_address             jsonb default null,
  p_razorpay_order_id   text default null,
  p_razorpay_payment_id text default null,
  p_payment_method      text default null
)
returns uuid
language plpgsql
security definer
-- `extensions` is where Supabase installs pgcrypto (gen_random_bytes) by
-- default, rather than `public`; include it so the call below resolves.
set search_path = public, extensions
as $$
declare
  v_order_id  uuid;
  v_order_num text;
  v_subtotal  numeric(12,2);
  v_discount  numeric(12,2);
  v_shipping  numeric(12,2);
  v_total     numeric(12,2);
  v_count     integer;
  v_status    order_status;
  v_coupon    public.coupons%rowtype;
  it          record;
begin
  select q.subtotal, q.discount_total, q.shipping_total, q.total, q.item_count
    into v_subtotal, v_discount, v_shipping, v_total, v_count
  from public.quote_cart(p_cart_id, p_user_id, p_coupon_code) q;

  -- Re-validate stock for real under lock (quote_cart's check above is only
  -- a preview and takes no locks).
  for it in
    select ci.quantity, vs.id as vs_id, vs.stock, vs.size, p.name
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
  end loop;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon from public.coupons where code = p_coupon_code;
  end if;

  v_order_num := 'S2V-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  v_status := case when p_razorpay_payment_id is not null
                then 'paid'::order_status else 'demo-placed'::order_status end;

  insert into public.orders
    (user_id, order_number, status, subtotal, discount_total, shipping_total,
     total, item_count, coupon_code, address, placed_at,
     razorpay_order_id, razorpay_payment_id, payment_method, paid_at)
  values
    (p_user_id, v_order_num, v_status, v_subtotal, v_discount, v_shipping,
     v_total, v_count, nullif(p_coupon_code, ''), p_address, now(),
     p_razorpay_order_id, p_razorpay_payment_id, p_payment_method,
     case when p_razorpay_payment_id is not null then now() else null end)
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

  if v_coupon.id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
    insert into public.coupon_redemptions (coupon_id, user_id, order_id, amount)
    values (v_coupon.id, p_user_id, v_order_id, v_discount);
  end if;

  delete from public.cart_items where cart_id = p_cart_id;

  insert into public.email_outbox (to_email, template, payload)
  select u.email, 'order_confirmation',
         jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_num, 'total', v_total)
  from public.users u where u.id = p_user_id;

  return v_order_id;
end;
$$;

-- Same deny-by-default posture as every other mutating/business RPC in this
-- project (see 0009_rls.sql) — these are only ever meant to be called by the
-- Express API with the service-role key, never directly via PostgREST by a
-- browser holding an anon/authenticated key.
revoke execute on function public.quote_cart(uuid, uuid, text) from anon, authenticated;
revoke execute on function public.place_order(uuid, uuid, text, jsonb, text, text, text) from anon, authenticated;
grant execute on function
  public.quote_cart(uuid, uuid, text),
  public.place_order(uuid, uuid, text, jsonb, text, text, text)
to service_role;
