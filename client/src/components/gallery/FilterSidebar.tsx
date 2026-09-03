import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FILTER_COLORS, FILTER_SIZES } from '@/lib/colors';
import { GENDERS, type NavCategory } from '@/lib/nav';
import { PriceRange } from './PriceRange';
import type { GalleryFilters } from '@/hooks/useProductFilters';

interface Props {
  filters: GalleryFilters;
  categories: NavCategory[];
  activeCount: number;
  apply: (patch: Partial<GalleryFilters>) => void;
  toggleInArray: (key: 'sizes' | 'colors', value: string) => void;
  clearAll: () => void;
  /** hide the "Filters · N / Clear all" row (the drawer has its own header) */
  hideHeader?: boolean;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink-100 py-6 first:pt-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">{title}</p>
      {children}
    </div>
  );
}

export function FilterSidebar({
  filters,
  categories,
  activeCount,
  apply,
  toggleInArray,
  clearAll,
  hideHeader,
}: Props) {
  return (
    <div>
      {!hideHeader && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">
            Filters{activeCount > 0 && <span className="text-ink-400"> · {activeCount}</span>}
          </p>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-clay-600 underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <Group title="Category">
        <ul className="space-y-1.5">
          <li>
            <FilterRadio
              label="All categories"
              checked={!filters.category}
              onClick={() => apply({ category: '' })}
            />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FilterRadio
                label={c.name}
                checked={filters.category === c.slug}
                onClick={() => apply({ category: c.slug })}
              />
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Gender">
        <div className="flex flex-wrap gap-2">
          <Chip label="All" active={!filters.gender} onClick={() => apply({ gender: '' })} />
          {GENDERS.map((g) => (
            <Chip
              key={g.value}
              label={g.label}
              active={filters.gender === g.value}
              onClick={() => apply({ gender: g.value })}
            />
          ))}
        </div>
      </Group>

      <Group title="Price">
        <PriceRange
          min={filters.minPrice}
          max={filters.maxPrice}
          onChange={(range) => apply({ minPrice: range.min, maxPrice: range.max })}
        />
      </Group>

      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {FILTER_SIZES.map((s) => (
            <Chip
              key={s}
              label={s}
              active={filters.sizes.includes(s)}
              onClick={() => toggleInArray('sizes', s)}
            />
          ))}
        </div>
      </Group>

      <Group title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {FILTER_COLORS.map((c) => {
            const active = filters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={active}
                onClick={() => toggleInArray('colors', c.name)}
                className={cn(
                  'relative h-7 w-7 rounded-full border transition-transform hover:scale-110',
                  active ? 'border-ink-900 ring-2 ring-ink-900 ring-offset-1' : 'border-ink-200'
                )}
                style={{ backgroundColor: c.hex }}
              >
                {active && (
                  <Check
                    className={cn(
                      'absolute inset-0 m-auto h-3.5 w-3.5',
                      ['White', 'Beige', 'Sky Blue', 'Powder Pink', 'Lilac'].includes(c.name)
                        ? 'text-ink-900'
                        : 'text-white'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Group>
    </div>
  );
}

function FilterRadio({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 text-left text-sm text-ink-700 hover:text-ink-900"
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-ink-900' : 'border-ink-300'
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-ink-900" />}
      </span>
      <span className={cn(checked && 'font-medium text-ink-900')}>{label}</span>
    </button>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-card border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-ink-900 bg-ink-900 text-canvas'
          : 'border-ink-200 text-ink-700 hover:border-ink-900'
      )}
    >
      {label}
    </button>
  );
}
