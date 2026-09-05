import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * Brand lockup: the SV crest + wordmark.
 *
 * Crest art lives in `client/public/`, backgrounds already removed:
 *   logo-mark-black.png  — solid black, for light surfaces (default)
 *   logo-mark-gold.png   — flat brand gold, use on dark surfaces
 *   logo-mark.png        — original metallic gold, dark surfaces only
 */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="S2VESTIS — home"
      className={cn(
        'inline-flex items-center gap-2 transition-opacity hover:opacity-70',
        className
      )}
    >
      <img
        src="/logo-mark-black.png"
        alt=""
        aria-hidden="true"
        width={37}
        height={40}
        className="h-9 w-auto lg:h-10"
      />
      <span className="font-display text-lg font-bold tracking-[0.12em] text-ink-900 sm:text-xl lg:text-2xl">
        S2VESTIS
      </span>
    </Link>
  );
}
