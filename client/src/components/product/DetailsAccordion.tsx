import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Section {
  title: string;
  content: React.ReactNode;
}

export function DetailsAccordion({
  sections,
  defaultOpen = 0,
}: {
  sections: Section[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-ink-100 border-y border-ink-100">
      {sections.map((s, i) => {
        const isOpen = open === i;
        return (
          <div key={s.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-semibold text-ink-900">{s.title}</span>
              <Plus
                className={cn(
                  'h-4 w-4 text-ink-500 transition-transform duration-300',
                  isOpen && 'rotate-45'
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 text-sm leading-relaxed text-ink-600">{s.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
