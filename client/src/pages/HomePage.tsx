import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { productsHref } from '@/lib/nav';

/**
 * Phase 2 home shell — hero + category strip + USP row.
 * The full auto-rotating carousel and live featured-products row land in Phase 3.
 */
export function HomePage() {
  const { categories } = useCategories();

  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-canvas">
        <div className="container-page grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-clay-200">
              New season
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] text-canvas sm:text-5xl lg:text-6xl">
              Considered essentials,
              <br />
              made to be worn out.
            </h1>
            <p className="mt-5 max-w-md text-base text-ink-200">
              Premium fabric, clean cuts, honest pricing. Build a wardrobe that lasts from the
              S2VESTIS core range.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-accent">
                Shop the collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={productsHref({ gender: 'women' })}
                className="btn border border-ink-600 text-canvas hover:bg-ink-800"
              >
                Shop women
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="aspect-[4/5] overflow-hidden rounded-card bg-ink-800"
          >
            <img
              src="https://picsum.photos/seed/s2v-hero/1000/1250"
              alt="S2VESTIS new season"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">Shop by category</h2>
          <Link to="/products" className="text-sm font-semibold text-clay-600 link-underline">
            All products
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              to={productsHref({ category: c.slug })}
              className="group relative aspect-[4/5] overflow-hidden rounded-card bg-ink-100"
            >
              <img
                src={`https://picsum.photos/seed/s2v-cat-${c.slug}/600/750`}
                alt={c.name}
                loading={i > 3 ? 'lazy' : undefined}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent p-4 text-sm font-semibold text-canvas">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-surface">
        <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
          <Usp icon={Truck} title="Free shipping" copy="On all orders over ₹1999" />
          <Usp icon={RefreshCw} title="Easy returns" copy="15-day no-questions returns" />
          <Usp icon={ShieldCheck} title="Secure checkout" copy="Your data stays protected" />
        </div>
      </section>
    </>
  );
}

function Usp({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Truck;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="text-xs text-ink-500">{copy}</p>
      </div>
    </div>
  );
}
