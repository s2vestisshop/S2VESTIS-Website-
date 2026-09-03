import { cn } from '@/lib/cn';
import type { Variant } from '@/types';

export function ColorSelector({
  variants,
  activeIndex,
  onChange,
}: {
  variants: Variant[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  if (variants.length <= 1) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="font-semibold text-ink-900">Colour</span>
        <span className="text-ink-500">{variants[activeIndex]?.color}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((v, i) => {
          const inStock = v.sizes.some((s) => s.stock > 0);
          return (
            <button
              key={v.color + i}
              type="button"
              title={v.color}
              aria-label={v.color}
              aria-pressed={i === activeIndex}
              onClick={() => onChange(i)}
              className={cn(
                'relative h-9 w-9 rounded-full border transition-transform hover:scale-105',
                i === activeIndex
                  ? 'border-ink-900 ring-2 ring-ink-900 ring-offset-2 ring-offset-canvas'
                  : 'border-ink-200'
              )}
              style={{ backgroundColor: v.colorHex }}
            >
              {!inStock && (
                <span className="absolute inset-0 m-auto h-px w-10 -rotate-45 bg-ink-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
