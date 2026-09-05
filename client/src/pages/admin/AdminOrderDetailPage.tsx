import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/format';
import { onImageError } from '@/lib/product';
import { orderStatusInfo } from '@/lib/orderStatus';
import type { AdminOrder } from '@/types';

const STATUS_OPTIONS = [
  'paid',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
];

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState(false);

  const load = () => {
    adminApi
      .getOrder(id)
      .then((o) => {
        setOrder(o);
        setNewStatus(o.status);
        setError(null);
      })
      .catch((e) => setError(toErrorMessage(e)));
  };

  useEffect(load, [id]);

  const updateStatus = async () => {
    if (!order || newStatus === order.status) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateOrderStatus(order._id, newStatus, note || undefined);
      setOrder(updated);
      setNote('');
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const retryShipment = async () => {
    if (!order) return;
    setShipping(true);
    setError(null);
    try {
      const updated = await adminApi.retryShipment(order._id);
      setOrder(updated);
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setShipping(false);
    }
  };

  if (!order) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  const info = orderStatusInfo(order.status);

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-ink-500 hover:text-ink-900">
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {order.customer?.name} · {order.customer?.email} · {fmtDateTime(order.createdAt)}
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide ${info.badgeClass}`}
        >
          {info.label}
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {order.paymentReviewRequired && (
        <div className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p className="font-semibold">Flagged for payment review</p>
          {order.paymentReviewNote && <p className="mt-1">{order.paymentReviewNote}</p>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-card border border-ink-100 bg-surface">
            <ul className="divide-y divide-ink-100">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 p-4">
                  <img
                    src={it.image}
                    onError={onImageError}
                    alt=""
                    className="h-16 w-13 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{it.name}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {it.color} · Size {it.size} · Qty {it.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    {formatPrice(it.price * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-ink-100 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="text-ink-900">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">Discount</dt>
                  <dd className="text-ink-900">-{formatPrice(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="text-ink-900">{formatPrice(order.shippingTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-1.5 font-bold text-ink-900">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-ink-100 bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
              Shipment history
            </p>
            {order.events.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">No shipment events yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {order.events.map((ev, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-ink-50 pb-2 last:border-0">
                    <span className="text-ink-900">{ev.description || ev.status}</span>
                    <span className="shrink-0 text-xs text-ink-400">{fmtDateTime(ev.occurredAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-card border border-ink-100 bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
              Delivery address
            </p>
            {order.address ? (
              <p className="mt-2 text-sm text-ink-700">
                {order.address.fullName} · {order.address.phone}
                <br />
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ''}
                <br />
                {order.address.city}
                {order.address.state ? `, ${order.address.state}` : ''} {order.address.postalCode}
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-500">No address on file.</p>
            )}
          </section>

          <section className="rounded-card border border-ink-100 bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Payment</p>
            <dl className="mt-2 space-y-1 text-sm text-ink-700">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Method</dt>
                <dd className="truncate">{order.paymentMethod || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Paid at</dt>
                <dd className="truncate">{order.paidAt ? fmtDateTime(order.paidAt) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Razorpay payment</dt>
                <dd className="truncate font-mono text-xs">{order.razorpayPaymentId || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-ink-100 bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Shipping</p>
            <dl className="mt-2 space-y-1 text-sm text-ink-700">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Courier</dt>
                <dd className="truncate">{order.courierName || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">AWB</dt>
                <dd className="truncate font-mono text-xs">{order.awbCode || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Est. delivery</dt>
                <dd className="truncate">{order.estimatedDeliveryDate || '—'}</dd>
              </div>
            </dl>
            {!order.shiprocketOrderId && (
              <button
                onClick={retryShipment}
                disabled={shipping}
                className="btn-outline mt-3 w-full text-sm"
              >
                {shipping ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Create shipment'}
              </button>
            )}
          </section>

          <section className="rounded-card border border-ink-100 bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
              Update status
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="mt-2 h-10 w-full rounded-card border border-ink-200 bg-surface px-3 text-sm focus:border-ink-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {orderStatusInfo(s).label}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (also clears the review flag)"
              rows={2}
              className="mt-2 w-full rounded-card border border-ink-200 bg-surface px-3 py-2 text-sm focus:border-ink-500 focus:outline-none"
            />
            <button
              onClick={updateStatus}
              disabled={saving || newStatus === order.status}
              className="btn-primary mt-2 w-full text-sm disabled:opacity-40"
            >
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update status'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
