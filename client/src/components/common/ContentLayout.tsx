import { useEffect } from 'react';
import { cn } from '@/lib/cn';

/**
 * Shared shell for static content pages (About, FAQ, policies, …).
 * `.prose-page` styles are defined in index.css.
 */
export function ContentLayout({
  title,
  intro,
  children,
  wide,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    document.title = `${title} — S2VESTIS`;
    return () => {
      document.title = 'S2VESTIS — Considered Apparel';
    };
  }, [title]);

  return (
    <div className="container-page py-12 lg:py-16">
      <div className={cn('mx-auto', wide ? 'max-w-4xl' : 'max-w-2xl')}>
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 text-base text-ink-500">{intro}</p>}
        <div className="prose-page mt-8">{children}</div>
      </div>
    </div>
  );
}
