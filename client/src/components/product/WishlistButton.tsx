import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addToWishlist, removeFromWishlist } from '@/features/wishlist/wishlistSlice';
import { pushToast } from '@/features/ui/uiSlice';
import { cn } from '@/lib/cn';
import type { Product } from '@/types';

export function WishlistButton({
  product,
  className,
  variant = 'floating',
}: {
  product: Product;
  className?: string;
  variant?: 'floating' | 'inline';
}) {
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.wishlist.ids.includes(product._id));

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      dispatch(removeFromWishlist(product._id));
      dispatch(pushToast('Removed from wishlist', 'info'));
    } else {
      dispatch(addToWishlist(product));
      dispatch(pushToast('Saved to wishlist', 'success'));
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        'inline-flex items-center justify-center transition-colors',
        variant === 'floating' &&
          'h-9 w-9 rounded-full bg-surface/90 text-ink-700 shadow-soft backdrop-blur hover:text-clay-600',
        variant === 'inline' && 'h-10 w-10 rounded-full border border-ink-200 text-ink-700 hover:border-ink-900',
        className
      )}
    >
      <motion.span
        key={String(active)}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      >
        <Heart className={cn('h-[18px] w-[18px]', active && 'fill-clay-500 text-clay-500')} />
      </motion.span>
    </button>
  );
}
