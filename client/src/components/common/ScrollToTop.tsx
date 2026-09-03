import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Resets scroll position on route change (pathname only, keeps hash jumps). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}
