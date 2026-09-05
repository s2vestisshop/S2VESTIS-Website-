import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { QuantityStepper } from './QuantityStepper';
import { PriceTag } from '@/components/product/PriceTag';
import { formatPrice } from '@/lib/format';
import { lineSavings } from '@/lib/cart';
import { productImage, onImageError } from '@/lib/product';
import type { CartItem } from '@/types';

interface Props {
  item: CartItem;
  pending?: boolean;
  onQty: (q: number) => void;
  onRemove: () => void;
}

export function CartLineItem({ item, pending, onQty, onRemove }: Props) {
  const product = item.product;
  const slug = product?.slug ?? '';
  // stock available for this exact variant/size (cap the stepper)
  const variant = product?.variants.find(
    (v) => v.color.toLowerCase() === item.color.toLowerCase()
  );
  const stock =
    variant?.sizes.find((s) => s.size.toLowerCase() === item.size.toLowerCase())?.stock ?? 0;
  const saved = lineSavings(item);

  return (
    <div className="flex gap-4 py-6">
      <Link
        to={`/products/${slug}`}
        className="h-32 w-24 shrink-0 overflow-hidden rounded-card bg-ink-100 sm:h-36 sm:w-28"
      >
        {product && (
          <img
            src={productImage(product)}
            alt={product.name}
            onError={onImageError}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/products/${slug}`}
              className="line-clamp-2 text-sm font-medium text-ink-900 hover:underline sm:text-base"
            >
              {product?.name ?? 'Product'}
            </Link>
            <p className="mt-1 text-xs text-ink-500">
              {item.color} · Size {item.size}
              <Link
                to={`/products/${slug}`}
                className="ml-2 text-clay-600 underline-offset-2 hover:underline"
              >
                Edit
              </Link>
            </p>
            {product && <PriceTag product={product} size="sm" className="mt-2" />}
          </div>

          <button
            onClick={onRemove}
            disabled={pending}
            aria-label="Remove item"
            className="shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-danger disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <QuantityStepper
            value={item.quantity}
            min={1}
            max={Math.max(Math.min(stock, 20), item.quantity)}
            onChange={onQty}
            disabled={pending}
            size="sm"
          />
          <div className="text-right">
            <p className="text-sm font-semibold text-ink-900">{formatPrice(item.lineTotal)}</p>
            <p className="text-[11px] text-ink-400">{formatPrice(item.priceAtAdd)} each</p>
            {saved > 0 && (
              <p className="text-[11px] font-semibold text-sage-600">Saved {formatPrice(saved)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
