import { useEffect, useState } from 'react';
import { adminApi, type AdminStats } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { Skeleton } from '@/components/ui/Skeleton';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setError(toErrorMessage(e)));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">Store overview at a glance.</p>

      {error && (
        <p className="mt-6 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats
          ? [
              ['Total products', stats.totalProducts],
              ['Active', stats.activeProducts],
              ['Orders', stats.totalOrders],
              [`Low stock (≤${stats.lowStockThreshold})`, stats.lowStockCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card border border-ink-100 bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold text-ink-900">{value}</p>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px]" />
            ))}
      </div>

      {stats && stats.lowStock.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-ink-900">Low stock</h2>
          <ul className="mt-3 divide-y divide-ink-100 rounded-card border border-ink-100 bg-surface">
            {stats.lowStock.map((p) => (
              <li key={p._id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-800">{p.name}</span>
                <span className="font-semibold text-clay-600">{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 rounded-card bg-ink-50 px-4 py-3 text-xs text-ink-500">
        Product &amp; category CRUD, image upload and the variant builder are built in Phase 8.
      </p>
    </div>
  );
}
