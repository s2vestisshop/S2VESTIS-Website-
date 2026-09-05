-- 0020 (2026-09-05) — admin order management RPCs: a shared JSON shaper,
-- list (search + status filter + paginate), single-order detail (+ items +
-- shipment history), and a manual status override. Mirrors
-- admin_list_products' "clamp, count, paged select, unwrap row.item" shape
-- exactly (table(item jsonb, total bigint)) — the same pattern this project
-- already uses instead of relying on PostgREST embedded-resource filtering
-- for the cross-table (order-number-or-customer) search.

create or replace function public.order_summary_json(o public.orders)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'orderNumber', o.order_number,
    'status', o.status,
    'itemCount', o.item_count,
    'subtotal', o.subtotal,
    'discountTotal', o.discount_total,
    'shippingTotal', o.shipping_total,
    'total', o.total,
    'address', o.address,
    'paymentMethod', o.payment_method,
    'paidAt', o.paid_at,
    'razorpayOrderId', o.razorpay_order_id,
    'razorpayPaymentId', o.razorpay_payment_id,
    'paymentReviewRequired', o.payment_review_required,
    'paymentReviewNote', o.payment_review_note,
    'shiprocketOrderId', o.shiprocket_order_id,
    'shiprocketShipmentId', o.shiprocket_shipment_id,
    'awbCode', o.awb_code,
    'courierName', o.courier_name,
    'trackingUrl', o.tracking_url,
    'shippedAt', o.shipped_at,
    'outForDeliveryAt', o.out_for_delivery_at,
    'deliveredAt', o.delivered_at,
    'estimatedDeliveryDate', o.estimated_delivery_date,
    'createdAt', o.created_at,
    'customer', (
      select jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email)
      from public.users u where u.id = o.user_id
    )
  );
$$;

create or replace function public.admin_list_orders(
  p_search text default null,
  p_status order_status default null,
  p_page   integer default 1,
  p_limit  integer default 20
)
returns table (item jsonb, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit  integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_page   integer := greatest(1, coalesce(p_page, 1));
  v_offset integer := (v_page - 1) * v_limit;
  v_total  bigint;
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  select count(*) into v_total
  from public.orders o
  join public.users u on u.id = o.user_id
  where (p_status is null or o.status = p_status)
    and (
      v_search is null
      or o.order_number ilike '%' || v_search || '%'
      or u.email ilike '%' || v_search || '%'
      or u.name ilike '%' || v_search || '%'
    );

  return query
    select public.order_summary_json(o), v_total
    from public.orders o
    join public.users u on u.id = o.user_id
    where (p_status is null or o.status = p_status)
      and (
        v_search is null
        or o.order_number ilike '%' || v_search || '%'
        or u.email ilike '%' || v_search || '%'
        or u.name ilike '%' || v_search || '%'
      )
    order by o.created_at desc
    limit v_limit offset v_offset;
end;
$$;

create or replace function public.admin_get_order(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.order_summary_json(o) || jsonb_build_object(
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', oi.name, 'slug', oi.slug, 'image', oi.image_url,
        'color', oi.color, 'size', oi.size,
        'quantity', oi.quantity, 'price', oi.unit_price
      ) order by oi.id), '[]'::jsonb)
      from public.order_items oi where oi.order_id = o.id
    ),
    'events', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'status', se.status, 'description', se.description, 'occurredAt', se.occurred_at
      ) order by se.occurred_at), '[]'::jsonb)
      from public.shipment_events se where se.order_id = o.id
    )
  )
  from public.orders o
  where o.id = p_id;
$$;

-- Manual override — used both for admin-driven status changes (cancel,
-- refund, resolving a payment_review_required flag) and as a safety net
-- when Shiprocket's webhook hasn't caught up yet. Every change is logged to
-- shipment_events for the same timeline the webhook writes into.
create or replace function public.admin_update_order_status(
  p_id     uuid,
  p_status order_status,
  p_note   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = p_status,
      payment_review_note = coalesce(p_note, payment_review_note),
      payment_review_required = case when p_note is not null then false else payment_review_required end
  where id = p_id;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.shipment_events (order_id, status, description)
  values (p_id, p_status::text, coalesce(p_note, 'Status updated by admin'));

  return public.admin_get_order(p_id);
end;
$$;

revoke execute on function public.order_summary_json(public.orders) from anon, authenticated;
revoke execute on function public.admin_list_orders(text, order_status, integer, integer) from anon, authenticated;
revoke execute on function public.admin_get_order(uuid) from anon, authenticated;
revoke execute on function public.admin_update_order_status(uuid, order_status, text) from anon, authenticated;
grant execute on function
  public.order_summary_json(public.orders),
  public.admin_list_orders(text, order_status, integer, integer),
  public.admin_get_order(uuid),
  public.admin_update_order_status(uuid, order_status, text)
to service_role;
