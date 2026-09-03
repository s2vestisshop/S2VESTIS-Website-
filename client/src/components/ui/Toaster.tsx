import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { dismissToast } from '@/features/ui/uiSlice';
import { cn } from '@/lib/cn';

const icons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const dispatch = useAppDispatch();

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[80] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDone={() => dispatch(dismissToast(t.id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastRow({
  toast,
  onDone,
}: {
  toast: { id: string; message: string; tone: 'info' | 'success' | 'error' };
  onDone: () => void;
}) {
  const Icon = icons[toast.tone];
  useEffect(() => {
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-card bg-ink-900 px-4 py-3 text-sm text-canvas shadow-lift'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          toast.tone === 'success' && 'text-sage-200',
          toast.tone === 'error' && 'text-clay-200'
        )}
      />
      <span className="flex-1">{toast.message}</span>
    </motion.div>
  );
}
