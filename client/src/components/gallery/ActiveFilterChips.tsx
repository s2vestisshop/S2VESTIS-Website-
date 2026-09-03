import { X } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { GalleryFilters } from '@/hooks/useProductFilters';
import type { NavCategory } from '@/lib/nav';

interface Props {
  filters: GalleryFilters;
  categories: NavCategory[];
  apply: (patch: Partial<GalleryFilters>) => void;
  toggleInArray: (key: 'sizes' | 'colors', value: string) => void;
  clearAll: () => void;
}

export function ActiveFilterChips({ filters, categories, apply, toggleInArray, clearAll }: Props) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.category) {
    const name = categories.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({ key: 'cat', label: name, onRemove: () => apply({ category: '' }) });
  }
  if (filters.gender) {
    chips.push({
      key: 'gender',
      label: filters.gender[0].toUpperCase() + filters.gender.slice(1),
      onRemove: () => apply({ gender: '' }),
    });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const lo = filters.minPrice !== undefined ? formatPrice(filters.minPrice) : '₹0';
    const hi = filters.maxPrice !== undefined ? formatPrice(filters.maxPrice) : 'max';
    chips.push({
      key: 'price',
      label: `${lo} – ${hi}`,
      onRemove: () => apply({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  filters.sizes.forEach((s) =>
    chips.push({ key: `size-${s}`, label: `Size ${s}`, onRemove: () => toggleInArray('sizes', s) })
  );
  filters.colors.forEach((c) =>
    chips.push({ key: `color-${c}`, label: c, onRemove: () => toggleInArray('colors', c) })
  );

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-pill bg-ink-100 py-1 pl-3 pr-2 text-xs font-medium text-ink-700 hover:bg-ink-200"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-xs font-semibold text-clay-600 underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
