import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { ordersApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, pluralize } from '@/lib/format';
import { onImageError } from '@/lib/product';
import { orderStatusInfo, DELIVERY_STEPS } from '@/lib/orderStatus';
import { cn } from '@/lib/cn';
import { usePageTitle } from '@/hooks/usePageTitle';
import { NotFoundPage } from '../NotFoundPage';
import type { Order } from '@/types';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function DeliveryStatus({ order }: { order: Order }) {
  if (order.status === 'cancelled' || order.status === 'refunded') {
    const info = orderStatusInfo(order.status);
    return (
      <div className={cn('mt-6 rounded-card p-4 text-sm font-medium', info.badgeClass)}>
        This order was {info.label.toLowerCase()}.
      </div>
    );
  }

  const currentIndex = Math.max(
    0,
    DELIVERY_STEPS.findIndex((s) => s.key === order.status)
  );

  return (
    <div className="mt-6 rounded-card border border-ink-100 bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
        Delivery status
      </p>
      <ol className="mt-4 space-y-4">
        {DELIVERY_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  done ? 'bg-sage-500 text-white' : 'bg-ink-100 text-ink-400'
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={cn('text-sm', done ? 'font-medium text-ink-900' : 'text-ink-400')}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {order.estimatedDeliveryDate && currentIndex < DELIVERY_STEPS.length - 1 && (
        <p className="mt-4 text-xs text-ink-500">
          Estimated delivery: {fmtShortDate(order.estimatedDeliveryDate)}
        </p>
      )}

      {order.trackingUrl && (
        <a
          href={order.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-clay-600 link-underline"
        >
          Track with {order.courierName || 'courier'}
          {order.awbCode ? ` (AWB ${order.awbCode})` : ''}
        </a>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');

  usePageTitle(order ? `Order ${order.orderNumber}` : 'Order');

  useEffect(() => {
    ordersApi
      .get(id)
      .then((o) => {
        setOrder(o);
        setStatus('ready');
      })
      .catch((e) => {
        setStatus(toErrorMessage(e).toLowerCase().includes('not found') ? 'notfound' : 'ready');
      });
  }, [id]);

  if (status === 'notfound') return <NotFoundPage />;

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/account/orders" className="text-sm text-ink-500 hover:text-ink-900">
          ← All orders
        </Link>

        {status === 'loading' || !order ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-sage-500" />
              <div>
                <h1 className="text-2xl font-bold text-ink-900">Order {order.orderNumber}</h1>
                <p className="mt-1 text-sm text-ink-500">
                  Placed {fmtDate(order.createdAt)} · {order.itemCount}{' '}
                  {pluralize(order.itemCount, 'item')}
                </p>
              </div>
            </div>

            <DeliveryStatus order={order} />

            {order.address && (
              <div className="mt-6 rounded-card border border-ink-100 bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                  Delivery address
                </p>
                <p className="mt-1.5 text-sm text-ink-700">
                  {order.address.fullName} · {order.address.phone}
                  <br />
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                  <br />
                  {order.address.city}
                  {order.address.state ? `, ${order.address.state}` : ''} {order.address.postalCode}
                </p>
              </div>
            )}

            <div className="mt-6 rounded-card border border-ink-100 bg-surface">
              <ul className="divide-y divide-ink-100">
                {order.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-4 p-4">
                    <Link
                      to={`/products/${it.slug}`}
                      className="h-20 w-16 shrink-0 overflow-hidden rounded bg-ink-100"
                    >
                      <img
                        src={it.image}
                        onError={onImageError}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${it.slug}`}
                        className="line-clamp-2 text-sm font-medium text-ink-900 hover:underline"
                      >
                        {it.name}
                      </Link>
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
              <div className="flex items-center justify-between border-t border-ink-100 p-4 text-sm">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="text-lg font-bold text-ink-900">{formatPrice(order.total)}</span>
              </div>
            </div>

            <Link to="/products" className="btn-outline mt-8">
              Continue shopping
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
