import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function QuantityStepper({
  value,
  min = 1,
  max = 20,
  onChange,
  disabled,
  size = 'md',
}: Props) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const btn =
    'inline-flex items-center justify-center text-ink-700 transition-colors hover:text-ink-900 disabled:opacity-30 disabled:hover:text-ink-700';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-card border border-ink-200 bg-surface',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={cn(btn, dim)}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn('min-w-8 text-center text-sm font-semibold tabular-nums')}>{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn(btn, dim)}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
