import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { productsApi } from '@/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchWishlist, hydrateItems } from '@/features/wishlist/wishlistSlice';
import { WishlistCard } from '@/components/wishlist/WishlistCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';

export function WishlistPage() {
  usePageTitle('Wishlist');
  const dispatch = useAppDispatch();
  const authed = useAppSelector((s) => s.auth.status === 'authenticated');
  const authInitialized = useAppSelector((s) => s.auth.initialized);
  const { ids, items } = useAppSelector((s) => s.wishlist);
  const [hydrating, setHydrating] = useState(false);

  // logged-in → server is authoritative
  useEffect(() => {
    if (authed) dispatch(fetchWishlist());
  }, [authed, dispatch]);

  // guest → hydrate product docs from the persisted ids
  useEffect(() => {
    if (!authInitialized || authed) return;
    const missing = ids.filter((id) => !items.some((p) => p._id === id));
    if (ids.length === 0 || missing.length === 0) return;
    setHydrating(true);
    productsApi
      .list({ ids: ids.join(','), limit: 50 })
      .then((res) => dispatch(hydrateItems(res.products)))
      .catch(() => {})
      .finally(() => setHydrating(false));
  }, [authed, authInitialized, ids, items, dispatch]);

  const showSkeleton = (hydrating || (!authInitialized && ids.length > 0)) && items.length === 0;

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Wishlist</h1>
        {items.length > 0 && (
          <p className="text-sm text-ink-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {showSkeleton ? (
        <div className="mt-8">
          <ProductGridSkeleton count={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-card border border-ink-100 bg-surface px-6 py-24 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
            <Heart className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-lg font-semibold text-ink-900">Your wishlist is empty</p>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            Tap the heart on any product to save it here for later.
          </p>
          <Link to="/products" className="btn-primary mt-6">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <WishlistCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
