import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { ordersApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, pluralize } from '@/lib/format';
import { onImageError } from '@/lib/product';
import { orderStatusInfo } from '@/lib/orderStatus';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Order } from '@/types';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function OrdersPage() {
  usePageTitle('Your orders');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .list()
      .then(setOrders)
      .catch((e) => setError(toErrorMessage(e)));
  }, []);

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/account" className="text-sm text-ink-500 hover:text-ink-900">
          ← Account
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">Orders</h1>

        {error && (
          <p className="mt-6 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        {!orders && !error && (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {orders && orders.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-card border border-ink-100 bg-surface px-6 py-20 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
              <Package className="h-7 w-7 text-ink-400" />
            </div>
            <p className="text-lg font-semibold text-ink-900">No orders yet</p>
            <p className="mt-1 text-sm text-ink-500">Orders you place will show up here.</p>
            <Link to="/products" className="btn-primary mt-6">
              Start shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className="mt-8 space-y-4">
            {orders.map((o) => (
              <li key={o._id}>
                <Link
                  to={`/account/orders/${o._id}`}
                  className="flex items-center gap-4 rounded-card border border-ink-100 bg-surface p-4 transition-colors hover:border-ink-300"
                >
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((it, i) => (
                      <img
                        key={i}
                        src={it.image}
                        onError={onImageError}
                        alt=""
                        className="h-12 w-10 rounded border-2 border-surface object-cover"
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{o.orderNumber}</p>
                    <p className="text-xs text-ink-500">
                      {fmtDate(o.createdAt)} · {o.itemCount} {pluralize(o.itemCount, 'item')} ·{' '}
                      {formatPrice(o.total)}
                    </p>
                  </div>
                  <span
                    className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${orderStatusInfo(o.status).badgeClass}`}
                  >
                    {orderStatusInfo(o.status).label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
