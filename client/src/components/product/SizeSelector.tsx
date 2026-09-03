import { cn } from '@/lib/cn';
import type { SizeStock } from '@/types';

export function SizeSelector({
  sizes,
  selected,
  onSelect,
  onSizeGuide,
  error,
}: {
  sizes: SizeStock[];
  selected: string | null;
  onSelect: (size: string) => void;
  onSizeGuide?: () => void;
  error?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">Size</span>
        {onSizeGuide && (
          <button
            type="button"
            className="text-xs text-ink-500 underline underline-offset-2 hover:text-ink-900"
            onClick={onSizeGuide}
          >
            Size guide
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((row) => {
          const soldOut = row.stock <= 0;
          const active = selected === row.size;
          return (
            <button
              key={row.size}
              type="button"
              disabled={soldOut}
              aria-pressed={active}
              onClick={() => onSelect(row.size)}
              className={cn(
                'min-w-12 rounded-card border px-3 py-2.5 text-sm font-medium transition-colors',
                soldOut && 'cursor-not-allowed border-ink-100 text-ink-300 line-through',
                !soldOut && active && 'border-ink-900 bg-ink-900 text-canvas',
                !soldOut && !active && 'border-ink-200 text-ink-800 hover:border-ink-900',
                error && !selected && !soldOut && 'border-danger'
              )}
            >
              {row.size}
            </button>
          );
        })}
      </div>
      {error && !selected && (
        <p className="mt-2 text-xs font-medium text-danger">Please select a size.</p>
      )}
    </div>
  );
}
