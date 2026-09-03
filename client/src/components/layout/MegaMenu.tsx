import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GENDERS, productsHref, type NavCategory } from '@/lib/nav';

interface MegaMenuProps {
  categories: NavCategory[];
  onNavigate: () => void;
}

export function MegaMenu({ categories, onNavigate }: MegaMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 right-0 top-full z-40 border-t border-ink-100 bg-surface shadow-soft"
    >
      <div className="container-page grid grid-cols-2 gap-x-8 gap-y-10 py-10 md:grid-cols-4">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-400">
            Shop by
          </p>
          <ul className="space-y-2.5">
            {GENDERS.map((g) => (
              <li key={g.value}>
                <Link
                  to={productsHref({ gender: g.value })}
                  onClick={onNavigate}
                  className="text-sm text-ink-700 link-underline hover:text-ink-900"
                >
                  {g.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/products"
                onClick={onNavigate}
                className="text-sm font-semibold text-clay-600 link-underline"
              >
                View everything
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-1 md:col-span-3">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-400">
            Categories
          </p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to={productsHref({ category: c.slug })}
                  onClick={onNavigate}
                  className="text-sm text-ink-700 link-underline hover:text-ink-900"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
