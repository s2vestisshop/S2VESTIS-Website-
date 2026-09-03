import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Product } from '@/types';

export function PriceTag({
  product,
  size = 'md',
  className,
}: {
  product: Pick<Product, 'price' | 'discountPrice' | 'discountPercent' | 'effectivePrice'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const discounted = product.discountPrice != null && product.discountPercent > 0;
  const text = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-[15px]';

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold text-ink-900', text)}>
        {formatPrice(product.effectivePrice)}
      </span>
      {discounted && (
        <>
          <span className={cn('text-ink-400 line-through', size === 'lg' ? 'text-base' : 'text-xs')}>
            {formatPrice(product.price)}
          </span>
          <span
            className={cn(
              'font-semibold text-clay-600',
              size === 'lg' ? 'text-sm' : 'text-[11px]'
            )}
          >
            {product.discountPercent}% off
          </span>
        </>
      )}
    </div>
  );
}
