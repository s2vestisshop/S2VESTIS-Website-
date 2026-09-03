import { useEffect, useState } from 'react';
import { categoriesApi } from '@/api';
import { FALLBACK_CATEGORIES, type NavCategory } from '@/lib/nav';
import type { Category } from '@/types';

let cache: Category[] | null = null;

/**
 * Lightweight category fetch with an in-memory cache and a static fallback,
 * so the navbar never renders empty.
 */
export function useCategories() {
  const [categories, setCategories] = useState<NavCategory[]>(
    cache ?? FALLBACK_CATEGORIES
  );
  const [full, setFull] = useState<Category[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    categoriesApi
      .list(true)
      .then((data) => {
        if (!alive) return;
        cache = data;
        setFull(data);
        setCategories(data.map((c) => ({ name: c.name, slug: c.slug })));
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { categories, full, loading };
}
