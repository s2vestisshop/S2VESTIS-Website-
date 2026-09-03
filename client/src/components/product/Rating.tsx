import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Rating({
  value,
  count,
  size = 'md',
  showCount = true,
  className,
}: {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
  className?: string;
}) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex" aria-hidden>
        <span className="flex text-ink-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(px, 'fill-current')} />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-clay-500"
          style={{ width: `${pct}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(px, 'shrink-0 fill-current')} />
          ))}
        </span>
      </span>
      <span className={cn('text-ink-500', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {value.toFixed(1)}
        {showCount && count !== undefined && (
          <span className="text-ink-400"> ({count})</span>
        )}
      </span>
    </div>
  );
}
