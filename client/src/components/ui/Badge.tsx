import { cn } from '@/lib/cn';

type Tone = 'sale' | 'neutral' | 'sage' | 'ink';

const tones: Record<Tone, string> = {
  sale: 'bg-clay-500 text-white',
  neutral: 'bg-ink-100 text-ink-700',
  sage: 'bg-sage-100 text-sage-700',
  ink: 'bg-ink-900 text-canvas',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
