import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FilterSidebar } from './FilterSidebar';
import type { GalleryFilters } from '@/hooks/useProductFilters';
import type { NavCategory } from '@/lib/nav';

interface Props {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  filters: GalleryFilters;
  categories: NavCategory[];
  activeCount: number;
  apply: (patch: Partial<GalleryFilters>) => void;
  toggleInArray: (key: 'sizes' | 'colors', value: string) => void;
  clearAll: () => void;
}

export function FilterDrawer({ open, onClose, resultCount, ...sidebar }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-canvas shadow-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">Filters</h2>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterSidebar {...sidebar} hideHeader />
            </div>

            <footer className="border-t border-ink-100 p-4">
              <button onClick={onClose} className="btn-primary w-full">
                Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </button>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
