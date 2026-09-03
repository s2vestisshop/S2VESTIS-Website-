import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { addToCart } from '@/features/cart/cartSlice';
import { removeFromWishlist } from '@/features/wishlist/wishlistSlice';
import { openCartDrawer, pushToast } from '@/features/ui/uiSlice';
import { toErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/product/PriceTag';
import { isDiscounted, isInStock, primaryVariant, productImage, onImageError } from '@/lib/product';
import type { Product } from '@/types';

export function WishlistCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const variant = primaryVariant(product);
  const inStockSizes = variant?.sizes.filter((s) => s.stock > 0) ?? [];
  const [size, setSize] = useState<string | null>(inStockSizes[0]?.size ?? null);
  const [busy, setBusy] = useState(false);
  const [moved, setMoved] = useState(false);
  const soldOut = !isInStock(product);

  const moveToCart = async () => {
    if (!size || !variant || busy) return;
    setBusy(true);
    try {
      await dispatch(
        addToCart({ productId: product._id, color: variant.color, size, quantity: 1 })
      ).unwrap();
      setMoved(true);
      dispatch(removeFromWishlist(product._id));
      dispatch(openCartDrawer());
    } catch (e) {
      dispatch(pushToast(toErrorMessage(e), 'error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-ink-100">
        <Link to={`/products/${product.slug}`} className="block h-full w-full">
          <img
            src={productImage(product)}
            alt={product.name}
            onError={onImageError}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {isDiscounted(product) && <Badge tone="sale">{product.discountPercent}% off</Badge>}
          {soldOut && <Badge tone="ink">Sold out</Badge>}
        </div>

        <button
          type="button"
          onClick={() => dispatch(removeFromWishlist(product._id))}
          aria-label="Remove from wishlist"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink-600 shadow-soft backdrop-blur transition-colors hover:text-danger"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-1 text-sm font-medium text-ink-900 hover:underline"
        >
          {product.name}
        </Link>
        <PriceTag product={product} className="mt-1" />

        {/* size picker */}
        {!soldOut && inStockSizes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(variant?.sizes ?? []).map((row) => {
              const oos = row.stock <= 0;
              return (
                <button
                  key={row.size}
                  type="button"
                  disabled={oos}
                  onClick={() => setSize(row.size)}
                  className={cn(
                    'h-7 min-w-7 rounded border px-1.5 text-[11px] font-medium transition-colors',
                    oos
                      ? 'cursor-not-allowed border-ink-100 text-ink-300 line-through'
                      : size === row.size
                        ? 'border-ink-900 bg-ink-900 text-canvas'
                        : 'border-ink-200 text-ink-700 hover:border-ink-900'
                  )}
                >
                  {row.size}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {soldOut ? (
            <Link to={`/products/${product.slug}`} className="btn-outline flex-1 text-center text-xs">
              View product
            </Link>
          ) : (
            <button
              onClick={moveToCart}
              disabled={busy || !size}
              className="btn-primary flex-1 text-xs"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : moved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Moved
                </>
              ) : (
                'Move to cart'
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
