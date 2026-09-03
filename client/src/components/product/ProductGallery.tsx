import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { PLACEHOLDER_IMAGE, onImageError } from '@/lib/product';

interface Props {
  images: string[];
  alt: string;
  /** resets to the first image when this changes (e.g. colour switch) */
  resetKey?: string;
}

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
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
  );
}
