import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { ordersApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, pluralize } from '@/lib/format';
import { onImageError } from '@/lib/product';
import { NotFoundPage } from '../NotFoundPage';
import type { Order } from '@/types';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');

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

            <p className="mt-4 rounded-card bg-clay-50 px-3 py-2 text-xs text-clay-700">
              This is a demonstration order — no payment was taken and nothing will ship.
            </p>

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
