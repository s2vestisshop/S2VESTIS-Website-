import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi, type AdminProductQuery } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { useCategories } from '@/hooks/useCategories';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Toggle } from '@/components/admin/Toggle';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/format';
import { productImage, onImageError, totalStock } from '@/lib/product';
import type { Pagination, Product } from '@/types';

const LIMIT = 12;

export function AdminProductsPage() {
  const { full: categories } = useCategories();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const query: AdminProductQuery = { page, limit: LIMIT };
    if (debouncedSearch) query.search = debouncedSearch;
    if (category) query.category = category;
    if (status) query.status = status;

    adminApi
      .listProducts(query)
      .then((res) => {
        if (!alive) return;
        setRows(res.products);
        setPagination(res.pagination);
        setError(null);
      })
      .catch((e) => alive && setError(toErrorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debouncedSearch, category, status, page]);

  const toggleActive = async (p: Product) => {
    setBusyId(p._id);
    try {
      const updated = await adminApi.updateProduct(p._id, { isActive: !p.isActive });
      setRows((r) => r.map((x) => (x._id === p._id ? { ...x, isActive: updated.isActive } : x)));
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await adminApi.deleteProduct(id);
      setRows((r) => r.filter((x) => x._id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Products</h1>
          {pagination && (
            <p className="mt-1 text-sm text-ink-500">{pagination.total} total</p>
          )}
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {/* filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="h-10 w-full rounded-card border border-ink-200 bg-surface pl-9 pr-3 text-sm focus:border-ink-500 focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-card border border-ink-200 bg-surface px-3 text-sm focus:border-ink-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 rounded-card border border-ink-200 bg-surface px-3 text-sm focus:border-ink-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Draft / inactive</option>
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {/* table */}
      <div className="mt-5 overflow-x-auto rounded-card border border-ink-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Active</th>
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
                  No products match those filters.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const stock = totalStock(p);
                return (
                  <tr key={p._id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={productImage(p)}
                          alt=""
                          onError={onImageError}
                          className="h-11 w-9 shrink-0 rounded object-cover"
                        />
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="font-medium text-ink-900 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {typeof p.category === 'object' ? p.category.name : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900">
                        {formatPrice(p.effectivePrice)}
                      </span>
                      {p.discountPrice != null && (
                        <span className="ml-1.5 text-xs text-ink-400 line-through">
                          {formatPrice(p.price)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={stock === 0 ? 'text-danger' : stock <= 5 ? 'text-clay-600' : 'text-ink-600'}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Toggle
                        checked={!!p.isActive}
                        disabled={busyId === p._id}
                        onChange={() => toggleActive(p)}
                        label={`Toggle ${p.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="rounded p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {confirmId === p._id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button
                              onClick={() => remove(p._id)}
                              disabled={busyId === p._id}
                              className="font-semibold text-danger hover:underline"
                            >
                              {busyId === p._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-ink-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmId(p._id)}
                            className="rounded p-2 text-ink-500 hover:bg-ink-100 hover:text-danger"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
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
