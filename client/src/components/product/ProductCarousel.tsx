import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SectionHeader } from '@/components/home/SectionHeader';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';

interface Props {
  title: string;
  subtitle?: string;
  products: Product[] | null;
  viewAllHref?: string;
  viewAllText?: string;
  quickAdd?: boolean;
}

export function ProductCarousel({
  title,
  subtitle,
  products,
  viewAllHref,
  viewAllText = 'View all',
  quickAdd = false,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState({ left: false, right: false });

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setArrows({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  };

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [products]);

  const nudge = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' });
  };

  if (products && products.length === 0) return null;

  return (
    <section className="py-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        linkText={viewAllHref ? viewAllText : undefined}
        linkTo={viewAllHref}
      />
      <div className="relative">
        <Arrow side="left" show={arrows.left} onClick={() => nudge(-1)} />
        <Arrow side="right" show={arrows.right} onClick={() => nudge(1)} />
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
                <ProductCard product={p as Product} quickAdd={quickAdd} />
              ) : (
                <ProductCardSkeleton />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Arrow({
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
