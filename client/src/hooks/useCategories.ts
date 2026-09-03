import { useEffect, useState } from 'react';
import { categoriesApi } from '@/api';
import { FALLBACK_CATEGORIES, type NavCategory } from '@/lib/nav';
import type { Category } from '@/types';

let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

function load(): Promise<Category[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = categoriesApi
      .list(true)
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Category fetch shared across the app — one request even when several
 * components mount at once, with an in-memory cache and a static fallback so
 * the navbar never renders empty.
 */
export function useCategories() {
  const [full, setFull] = useState<Category[]>(cache ?? []);
  const [categories, setCategories] = useState<NavCategory[]>(
    cache ? cache.map((c) => ({ name: c.name, slug: c.slug })) : FALLBACK_CATEGORIES
  );
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    load()
      .then((data) => {
        if (!alive) return;
        setFull(data);
        setCategories(data.map((c) => ({ name: c.name, slug: c.slug })));
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { categories, full, loading };
}
