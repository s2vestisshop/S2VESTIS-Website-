import { useEffect } from 'react';

const BASE = 'S2VESTIS';
const DEFAULT_TITLE = `${BASE} — Considered Apparel`;

/**
 * Sets `document.title` for the current route.
 *
 *   usePageTitle('Cart')            → "Cart — S2VESTIS"
 *   usePageTitle()                  → "S2VESTIS — Considered Apparel"
 *   usePageTitle(loading ? null : name)  // pass null/undefined while unknown
 *
 * SPA-only (crawlers that don't run JS see index.html's static <title>), but
 * covers real users, browser history, shared tabs and bookmarks.
 */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
