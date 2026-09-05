import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminApi, type AdminOrderQuery } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/format';
import { orderStatusInfo } from '@/lib/orderStatus';
import type { AdminOrder, Pagination } from '@/types';

const LIMIT = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const query: AdminOrderQuery = { page, limit: LIMIT };
    if (debouncedSearch) query.search = debouncedSearch;
    if (status) query.status = status;

    adminApi
      .listOrders(query)
      .then((res) => {
        if (!alive) return;
        setRows(res.orders);
        setPagination(res.pagination);
        setError(null);
      })
      .catch((e) => alive && setError(toErrorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debouncedSearch, status, page]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
          {pagination && <p className="mt-1 text-sm text-ink-500">{pagination.total} total</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer name or email"
            className="h-10 w-full rounded-card border border-ink-200 bg-surface pl-9 pr-3 text-sm focus:border-ink-500 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-card border border-ink-200 bg-surface px-3 text-sm focus:border-ink-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 overflow-x-auto rounded-card border border-ink-100">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-ink-500">
                  No orders match those filters.
                </td>
              </tr>
            ) : (
              rows.map((o) => {
                const info = orderStatusInfo(o.status);
                return (
                  <tr key={o._id} className="align-middle">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${o._id}`}
                        className="font-medium text-ink-900 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      {o.paymentReviewRequired && (
                        <span className="ml-2 rounded-pill bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-danger">
                          Review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <div>{o.customer?.name}</div>
                      <div className="text-xs text-ink-400">{o.customer?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${info.badgeClass}`}
                      >
                        {info.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/orders/${o._id}`}
                        className="text-sm font-semibold text-clay-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-outline px-3 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-ink-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="btn-outline px-3 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
