import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { productsApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/useCategories';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton, ProductCardSkeleton } from '@/components/ui/Skeleton';
import { FilterSidebar } from '@/components/gallery/FilterSidebar';
import { FilterDrawer } from '@/components/gallery/FilterDrawer';
import { SortDropdown } from '@/components/gallery/SortDropdown';
import { ActiveFilterChips } from '@/components/gallery/ActiveFilterChips';
import { formatCount, pluralize } from '@/lib/format';
import type { Pagination, Product } from '@/types';

const LIMIT = 12;

export function ProductsPage() {
  const { filters, apply, toggleInArray, clearAll, activeCount, toQuery } = useProductFilters();
  const { categories } = useCategories();

  const [items, setItems] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refetchTick, setRefetchTick] = useState(0);

  const reqId = useRef(0);

  // serialised filter signature (everything except page)
  const filterKey = useMemo(
    () => `${JSON.stringify(toQuery(1, LIMIT))}#${refetchTick}`,
    [toQuery, refetchTick]
  );

  // (re)fetch page 1 whenever filters change
  useEffect(() => {
    const id = ++reqId.current;
    setStatus('loading');
    setPage(1);
    productsApi
      .list(toQuery(1, LIMIT))
      .then((res) => {
        if (id !== reqId.current) return;
        setItems(res.products);
        setPagination(res.pagination);
        setStatus('ready');
        setError(null);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(toErrorMessage(e));
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // append subsequent pages
  useEffect(() => {
    if (page === 1) return;
    const id = ++reqId.current;
    setLoadingMore(true);
    productsApi
      .list(toQuery(page, LIMIT))
      .then((res) => {
        if (id !== reqId.current) return;
        setItems((prev) => [...prev, ...res.products]);
        setPagination(res.pagination);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(toErrorMessage(e));
      })
      .finally(() => id === reqId.current && setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const canLoadMore = pagination?.hasNextPage ?? false;
  const loadMore = useCallback(() => {
    if (canLoadMore && !loadingMore) setPage((p) => p + 1);
  }, [canLoadMore, loadingMore]);

  // infinite scroll sentinel
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canLoadMore) return;
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: '600px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [canLoadMore, loadMore]);

  const heading =
    categories.find((c) => c.slug === filters.category)?.name ??
    (filters.search ? `“${filters.search}”` : 'All products');
  const total = pagination?.total ?? 0;

  const sidebarProps = { filters, categories, activeCount, apply, toggleInArray, clearAll };

  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Shop</p>
        <h1 className="mt-1 text-3xl font-bold text-ink-900 sm:text-4xl">{heading}</h1>
        {status === 'ready' && (
          <p className="mt-1.5 text-sm text-ink-500">
            {formatCount(total)} {pluralize(total, 'product')}
          </p>
        )}
      </header>

      {/* mobile controls */}
      <div className="mb-5 flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-card border border-ink-200 bg-surface px-4 py-2.5 text-sm font-medium text-ink-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[11px] font-bold text-canvas">
              {activeCount}
            </span>
          )}
        </button>
        <SortDropdown value={filters.sort} onChange={(sort) => apply({ sort })} />
      </div>

      <div className="lg:grid lg:grid-cols-[248px_1fr] lg:gap-10">
        {/* desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterSidebar {...sidebarProps} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
            <ActiveFilterChips
              filters={filters}
              categories={categories}
              apply={apply}
              toggleInArray={toggleInArray}
              clearAll={clearAll}
            />
            <SortDropdown
              value={filters.sort}
              onChange={(sort) => apply({ sort })}
              className="shrink-0"
            />
          </div>

          <div className="mb-4 lg:hidden">
            <ActiveFilterChips
              filters={filters}
              categories={categories}
              apply={apply}
              toggleInArray={toggleInArray}
              clearAll={clearAll}
            />
          </div>

          {status === 'loading' && <ProductGridSkeleton count={9} />}

          {status === 'error' && (
            <div className="rounded-card border border-danger/30 bg-danger/5 px-4 py-8 text-center">
              <p className="text-sm text-danger">{error}</p>
              <button
                onClick={() => setRefetchTick((t) => t + 1)}
                className="btn-outline mt-4"
              >
                Retry
              </button>
            </div>
          )}

          {status === 'ready' && items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-card border border-ink-100 bg-surface px-6 py-20 text-center">
              <p className="text-lg font-semibold text-ink-900">No products match those filters</p>
              <p className="mt-1 max-w-sm text-sm text-ink-500">
                Try removing a filter or widening the price range.
              </p>
              {activeCount > 0 && (
                <button onClick={clearAll} className="btn-primary mt-6">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {status === 'ready' && items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p, i) => (
                  <ProductCard key={p._id} product={p} quickAdd eager={i < 4} />
                ))}
                {loadingMore &&
                  Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={`s-${i}`} />)}
              </div>

              <div ref={sentinel} className="h-px" />

              {canLoadMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-outline"
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}

              {!canLoadMore && items.length > LIMIT && (
                <p className="mt-10 text-center text-xs text-ink-400">
                  You've reached the end · {formatCount(total)} {pluralize(total, 'product')}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={total}
        {...sidebarProps}
      />
    </div>
  );
}
