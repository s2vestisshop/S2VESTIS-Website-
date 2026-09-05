import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { HERO_INTERVAL, HERO_SLIDES } from '@/data/heroSlides';
import { onImageError } from '@/lib/product';
import { cn } from '@/lib/cn';

export function HeroCarousel() {
  const slides = HERO_SLIDES;
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const go = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  // autoplay
  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return;
    timer.current = window.setTimeout(() => go(index + 1, 1), HERO_INTERVAL);
    return () => window.clearTimeout(timer.current);
  }, [index, paused, reduceMotion, slides.length, go]);

  // keyboard arrows when focused
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  const slide = slides[index];
  const alignCenter = slide.align === 'center';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative isolate overflow-hidden bg-ink-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div className="relative h-[42vh] min-h-[300px] w-full sm:h-[80vh] lg:h-[86vh]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04, x: direction * 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02, x: direction * -40 }}
            transition={{ duration: reduceMotion ? 0.3 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt=""
              onError={onImageError}
              className="h-full w-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
            />
            <div
              className={cn(
                'absolute inset-0',
                alignCenter
                  ? 'bg-gradient-to-t from-ink-900/80 via-ink-900/40 to-ink-900/50'
                  : 'bg-gradient-to-r from-ink-900/85 via-ink-900/45 to-transparent'
              )}
            />
          </motion.div>
        </AnimatePresence>

        {/* copy */}
        <div className="container-page relative flex h-full items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'max-w-xl text-canvas',
                alignCenter && 'mx-auto max-w-2xl text-center'
              )}
            >
              {slide.eyebrow && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-clay-200 sm:text-xs">
                  {slide.eyebrow}
                </p>
              )}
              <h1 className="mt-2 text-2xl font-bold leading-[1.1] text-canvas sm:mt-4 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                {slide.title}
              </h1>
              <p
                className={cn(
                  'mt-2.5 text-sm text-ink-100 sm:mt-5 sm:text-base',
                  alignCenter ? 'mx-auto max-w-md' : 'max-w-md'
                )}
              >
                {slide.subtitle}
              </p>
              <div className={cn('mt-4 flex flex-wrap gap-3 sm:mt-8', alignCenter && 'justify-center')}>
                <Link to={slide.ctaLink} className="btn-accent">
                  {slide.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {slide.secondaryText && slide.secondaryLink && (
                  <Link
                    to={slide.secondaryLink}
                    className="btn border border-ink-500 text-canvas hover:bg-ink-800"
                  >
                    {slide.secondaryText}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* arrows */}
        {slides.length > 1 && (
          <>
            <CarouselArrow side="left" onClick={prev} />
            <CarouselArrow side="right" onClick={next} />
          </>
        )}

        {/* dots */}
        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i, i > index ? 1 : -1)}
                className={cn(
                  'h-1.5 rounded-pill transition-all duration-300',
                  i === index ? 'w-8 bg-canvas' : 'w-2.5 bg-canvas/45 hover:bg-canvas/70'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CarouselArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous slide' : 'Next slide'}
      className={cn(
        'absolute top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-canvas/30 bg-ink-900/20 p-3 text-canvas backdrop-blur transition-colors hover:bg-ink-900/50 sm:flex',
        side === 'left' ? 'left-4 lg:left-8' : 'right-4 lg:right-8'
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
