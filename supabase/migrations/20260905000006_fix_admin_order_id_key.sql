-- 0021 (2026-09-05) — fix order_summary_json(): it returned the order's id
-- as the key "id", but every client-side type/component (Order, AdminOrder,
-- AdminOrdersPage, AdminOrderDetailPage) expects "_id" — matching the same
-- convention every other order-returning endpoint already uses (see
-- db/orders.js's mapOrder()). Caught live: clicking "View" on an admin order
-- navigated to /admin/orders/undefined. create or replace is safe here since
-- nothing else reads this function's old "id" key.
create or replace function public.order_summary_json(o public.orders)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    '_id', o.id,
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

revoke execute on function public.order_summary_json(public.orders) from anon, authenticated;
grant execute on function public.order_summary_json(public.orders) to service_role;
