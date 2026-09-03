import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { productsApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import type { Product } from '@/types';
import { SectionHeader } from './SectionHeader';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    let alive = true;
    productsApi
      .list({ featured: true, limit: 12, sort: 'popularity' })
      .then((res) => alive && setProducts(res.products))
      .catch((e) => alive && setError(toErrorMessage(e)));
    return () => {
      alive = false;
    };
  }, []);

  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  };

  useEffect(() => {
    updateArrows();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [products]);

  const nudge = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' });
  };

  if (error) return null; // fail quietly on the home page

  return (
    <section className="container-page py-16">
      <SectionHeader
        title="Trending now"
        subtitle="Most-loved pieces from the current range."
        linkText="View all"
        linkTo="/products?sort=popularity"
      />

      <div className="relative">
        {/* desktop scroll buttons */}
        <ScrollButton side="left" show={canScroll.left} onClick={() => nudge(-1)} />
        <ScrollButton side="right" show={canScroll.right} onClick={() => nudge(1)} />

        <div
          ref={scroller}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        >
          {(products ?? Array.from({ length: 6 })).map((p, i) => (
            <div
              key={products ? (p as Product)._id : i}
              className="w-[64%] shrink-0 snap-start xs:w-[46%] sm:w-[38%] md:w-[30%] lg:w-[23%]"
            >
              {products ? (
                <ProductCard product={p as Product} eager={i < 4} />
              ) : (
                <ProductCardSkeleton />
              )}
            </div>
          ))}
        </div>
      </div>

      {products && products.length === 0 && (
        <p className="text-sm text-ink-500">No featured products yet.</p>
      )}
    </section>
  );
}

function ScrollButton({
  side,
  show,
  onClick,
}: {
  side: 'left' | 'right';
  show: boolean;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
      className={cn(
        'absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-800 shadow-soft transition-opacity hover:bg-ink-50 lg:flex',
        side === 'left' ? '-left-5' : '-right-5',
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
