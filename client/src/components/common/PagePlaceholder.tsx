import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';

/**
 * Interim page shell used while individual pages are built out in later phases.
 */
export function PagePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description?: string;
}) {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="mb-5 inline-flex items-center gap-2 rounded-pill bg-ink-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink-500">
        <Hammer className="h-3.5 w-3.5" />
        {phase}
      </span>
      <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-ink-500">
        {description ?? 'This page is part of a later build phase. The layout shell, routing, store and API layer are already wired up.'}
      </p>
      <Link to="/" className="btn-outline mt-8">
        Back to home
      </Link>
    </section>
  );
}
