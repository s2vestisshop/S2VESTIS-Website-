import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Gender, ProductQuery } from '@/types';

export type SortKey = NonNullable<ProductQuery['sort']>;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export interface GalleryFilters {
  category: string;
  gender: Gender | '';
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  search: string;
  sort: SortKey;
}

const num = (v: string | null) => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function useProductFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<GalleryFilters>(
    () => ({
      category: params.get('category') ?? '',
      gender: (params.get('gender') as Gender | null) ?? '',
      minPrice: num(params.get('minPrice')),
      maxPrice: num(params.get('maxPrice')),
      sizes: params.getAll('size'),
      colors: params.getAll('color'),
      search: params.get('search') ?? '',
      sort: (params.get('sort') as SortKey | null) ?? 'newest',
    }),
    [params]
  );

  /** Replace the whole param set from a patch (undefined / '' / [] clears a key). */
  const apply = useCallback(
    (patch: Partial<GalleryFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...filters, ...patch };

          const setSingle = (key: string, value?: string | number) => {
            next.delete(key);
            if (value !== undefined && value !== '' && value !== null) {
              next.set(key, String(value));
            }
          };
          const setMulti = (key: string, values: string[]) => {
            next.delete(key);
            values.forEach((v) => next.append(key, v));
          };

          setSingle('category', merged.category);
          setSingle('gender', merged.gender);
          setSingle('minPrice', merged.minPrice);
          setSingle('maxPrice', merged.maxPrice);
          setSingle('search', merged.search);
          setSingle('sort', merged.sort === 'newest' ? '' : merged.sort);
          setMulti('size', merged.sizes);
          setMulti('color', merged.colors);

          return next;
        },
        { replace: true }
      );
    },
    [filters, setParams]
  );

  const toggleInArray = useCallback(
    (key: 'sizes' | 'colors', value: string) => {
      const current = filters[key];
      const nextArr = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      apply({ [key]: nextArr } as Partial<GalleryFilters>);
    },
    [apply, filters]
  );

  const clearAll = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        const kept = prev.get('search');
        if (kept) next.set('search', kept);
        return next;
      },
      { replace: true }
    );
  }, [setParams]);

  const activeCount =
    (filters.category ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length;

  /** The query object sent to the products API (page is handled by the caller). */
  const toQuery = useCallback(
    (page: number, limit: number): ProductQuery => ({
      category: filters.category || undefined,
      gender: filters.gender || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      size: filters.sizes.length ? filters.sizes.join(',') : undefined,
      color: filters.colors.length ? filters.colors.join(',') : undefined,
      search: filters.search || undefined,
      sort: filters.sort,
      page,
      limit,
    }),
    [filters]
  );

  return { filters, apply, toggleInArray, clearAll, activeCount, toQuery };
}
