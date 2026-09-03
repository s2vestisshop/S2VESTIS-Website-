import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="S2VESTIS — home"
      className={cn(
        'font-display text-2xl font-bold tracking-[0.12em] text-ink-900 transition-opacity hover:opacity-70',
        className
      )}
    >
      S2VESTIS
    </Link>
  );
}
