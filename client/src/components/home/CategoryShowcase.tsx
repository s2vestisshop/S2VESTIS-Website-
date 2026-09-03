import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import { productsHref } from '@/lib/nav';
import { PLACEHOLDER_IMAGE } from '@/lib/product';
import { SectionHeader } from './SectionHeader';

export function CategoryShowcase() {
  const { categories, full } = useCategories();
  const imageBySlug = new Map(full.map((c) => [c.slug, c.image]));

  return (
    <section className="container-page py-16">
      <SectionHeader
        title="Shop by category"
        subtitle="Eight core categories, for men and women."
        linkText="All products"
        linkTo="/products"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: (i % 4) * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={productsHref({ category: c.slug })}
              className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-ink-100"
            >
              <img
                src={imageBySlug.get(c.slug) || `https://picsum.photos/seed/s2v-cat-${c.slug}/600/750`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
                alt={c.name}
                loading={i > 3 ? 'lazy' : undefined}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="text-sm font-semibold text-canvas">{c.name}</span>
                <span className="mt-0.5 block text-xs text-canvas/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Shop now →
                </span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
