import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { PLACEHOLDER_IMAGE, onImageError } from '@/lib/product';

interface Props {
  images: string[];
  alt: string;
  /** resets to the first image when this changes (e.g. colour switch) */
  resetKey?: string;
}

/** Auto-advance interval for the mobile image carousel (ms). */
const MOBILE_INTERVAL = 4000;
/** How long autoplay stays paused after the shopper touches / swipes (ms). */
const RESUME_DELAY = 3500;

export function ProductGallery({ images, alt, resetKey }: Props) {
  const pics = images.length ? images : [PLACEHOLDER_IMAGE];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setZoom(false);
  }, [resetKey]);

  const onMove = (e: React.MouseEvent) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <>
      {/* mobile: swipeable, auto-advancing carousel */}
      <MobileGallery pics={pics} alt={alt} resetKey={resetKey} />

      {/* sm+ : thumbnail rail + hover-to-zoom main image */}
      <div className="hidden gap-3 sm:flex sm:flex-row">
        {/* thumbnails */}
        {pics.length > 1 && (
          <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
            {pics.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'h-20 w-16 shrink-0 overflow-hidden rounded-card border transition-colors sm:h-24 sm:w-20',
                  i === index ? 'border-ink-900' : 'border-ink-200 hover:border-ink-400'
                )}
              >
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={onImageError}
                />
              </button>
            ))}
          </div>
        )}

        {/* main image */}
        <div
          ref={frameRef}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
          onClick={() => setZoom((z) => !z)}
          className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-card bg-ink-100"
        >
          <img
            src={pics[index]}
            alt={alt}
            className={cn(
              'h-full w-full object-cover transition-transform duration-300 ease-out-expo',
              zoom ? 'scale-[1.9]' : 'scale-100'
            )}
            style={{ transformOrigin: origin }}
            onError={onImageError}
          />
          <span
            className={cn(
              'pointer-events-none absolute bottom-3 right-3 hidden rounded-pill bg-ink-900/70 px-2.5 py-1 text-[11px] font-medium text-canvas transition-opacity duration-200 sm:block',
              zoom ? 'opacity-0' : 'opacity-100'
            )}
          >
            Hover to zoom · click to hold
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Mobile product gallery: a native scroll-snap carousel.
 * - swipe by hand (native horizontal scroll + snap)
 * - auto-advances every MOBILE_INTERVAL, and pauses while the shopper is
 *   touching / has just swiped (resumes RESUME_DELAY after the last touch)
 * - honours prefers-reduced-motion (no autoplay)
 */
function MobileGallery({
  pics,
  alt,
  resetKey,
}: {
  pics: string[];
  alt: string;
  resetKey?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const interacting = useRef(false);
  const resumeTimer = useRef<number | undefined>(undefined);

  const scrollToIndex = (i: number, smooth = true) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  // keep the dot indicator in sync with the scroll position
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  // reset to the first image on colour switch
  useEffect(() => {
    setIndex(0);
    scrollToIndex(0, false);
  }, [resetKey]);

  // autoplay
  useEffect(() => {
    if (pics.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      const el = scroller.current;
      if (!el || interacting.current || document.hidden) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      const next = (current + 1) % pics.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, MOBILE_INTERVAL);
    return () => window.clearInterval(id);
  }, [pics.length]);

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const hold = () => {
    interacting.current = true;
    window.clearTimeout(resumeTimer.current);
  };
  const release = () => {
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      interacting.current = false;
    }, RESUME_DELAY);
  };

  return (
    <div className="sm:hidden">
      <div
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={hold}
        onPointerUp={release}
        onPointerCancel={release}
        onTouchStart={hold}
        onTouchEnd={release}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-card bg-ink-100"
      >
        {pics.map((src, i) => (
          <div key={src + i} className="aspect-[4/5] w-full shrink-0 snap-start">
            <img
              src={src}
              alt={i === 0 ? alt : ''}
              className="h-full w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={onImageError}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {pics.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {pics.map((src, i) => (
            <button
              key={src + i}
              type="button"
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              onClick={() => scrollToIndex(i)}
              className={cn(
                'h-1.5 rounded-pill transition-all duration-300',
                i === index ? 'w-6 bg-ink-900' : 'w-1.5 bg-ink-300 hover:bg-ink-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
