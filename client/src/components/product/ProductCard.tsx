import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { addToCart } from '@/features/cart/cartSlice';
import { openCartDrawer, pushToast } from '@/features/ui/uiSlice';
import { toErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from './PriceTag';
import { WishlistButton } from './WishlistButton';
import {
  colorSwatches,
  isDiscounted,
  isInStock,
  onImageError,
  primaryVariant,
  variantImage,
} from '@/lib/product';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
  /** show colour swatches under the image (default true) */
  showSwatches?: boolean;
  /** enable the hover "add to cart" size picker (gallery grid) */
  quickAdd?: boolean;
  eager?: boolean;
}

export function ProductCard({
  product,
  className,
  showSwatches = true,
  quickAdd = false,
  eager,
}: ProductCardProps) {
  const dispatch = useAppDispatch();
  const swatches = colorSwatches(product);
  const [activeColor, setActiveColor] = useState(primaryVariant(product)?.color ?? '');
  const [addingSize, setAddingSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const activeVariant =
    product.variants.find((v) => v.color === activeColor) ?? primaryVariant(product);
  const image = variantImage(activeVariant);
  const hoverImage = activeVariant?.images?.[1];
  const outOfStock = !isInStock(product);

  const sizeRows = useMemo(
    () => activeVariant?.sizes ?? [],
    [activeVariant]
  );

  const quickAddSize = async (size: string) => {
    if (addingSize) return;
    setAddingSize(size);
    try {
      await dispatch(
        addToCart({ productId: product._id, color: activeColor, size, quantity: 1 })
      ).unwrap();
      setAdded(true);
      dispatch(openCartDrawer());
      window.setTimeout(() => setAdded(false), 1600);
    } catch (err) {
      dispatch(pushToast(toErrorMessage(err), 'error'));
    } finally {
      setAddingSize(null);
    }
  };

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-ink-100">
        <Link to={`/products/${product.slug}`} aria-label={product.name} className="block h-full w-full">
          <img
            src={image}
            alt={product.name}
            loading={eager ? 'eager' : 'lazy'}
            onError={onImageError}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-500',
              hoverImage && 'group-hover:opacity-0'
            )}
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {isDiscounted(product) && <Badge tone="sale">{product.discountPercent}% off</Badge>}
          {outOfStock && <Badge tone="ink">Sold out</Badge>}
        </div>

        <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <WishlistButton product={product} />
        </div>

        {/* hover: quick-add size picker (gallery) or a link (compact) */}
        {quickAdd && !outOfStock ? (
          <div className="absolute inset-x-2 bottom-2 translate-y-3 opacity-0 transition-all duration-300 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 max-sm:hidden">
            <div className="rounded-card bg-surface/95 p-2 shadow-lift backdrop-blur">
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.p
                    key="added"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-sage-600"
                  >
                    <Check className="h-4 w-4" /> Added to cart
                  </motion.p>
                ) : (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      Quick add
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sizeRows.map((row) => {
                        const soldOut = row.stock <= 0;
                        const busy = addingSize === row.size;
                        return (
                          <button
                            key={row.size}
                            type="button"
                            disabled={soldOut || !!addingSize}
                            onClick={() => quickAddSize(row.size)}
                            className={cn(
                              'flex h-8 min-w-8 items-center justify-center rounded border px-1.5 text-xs font-medium transition-colors',
                              soldOut
                                ? 'cursor-not-allowed border-ink-100 text-ink-300 line-through'
                                : 'border-ink-200 text-ink-800 hover:border-ink-900 hover:bg-ink-900 hover:text-canvas'
                            )}
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : row.size}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
            <Link to={`/products/${product.slug}`} className="btn-primary w-full text-center text-xs">
              {outOfStock ? 'View product' : 'Choose options'}
            </Link>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-1 text-sm font-medium text-ink-900 hover:underline"
        >
          {product.name}
        </Link>

        <PriceTag product={product} className="mt-1" />

        {showSwatches && swatches.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {swatches.slice(0, 5).map((s) => (
              <button
                key={s.color}
                type="button"
                aria-label={`Show ${s.color}`}
                aria-pressed={s.color === activeColor}
                onClick={() => setActiveColor(s.color)}
                className={cn(
                  'h-4 w-4 rounded-full border transition-transform',
                  s.color === activeColor
                    ? 'border-ink-900 ring-1 ring-ink-900'
                    : 'border-ink-200 hover:scale-110'
                )}
                style={{ backgroundColor: s.colorHex }}
              />
            ))}
            {swatches.length > 5 && (
              <span className="text-[11px] text-ink-400">+{swatches.length - 5}</span>
            )}
          </div>
        )}

        {quickAdd && sizeRows.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-400">
            {sizeRows.map((row) => (
              <span key={row.size} className={cn(row.stock <= 0 && 'line-through')}>
                {row.size}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
