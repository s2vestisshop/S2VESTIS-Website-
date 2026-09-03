import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-card font-semibold transition-all duration-200 ease-out-expo disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

const variants: Record<Variant, string> = {
  primary: 'bg-ink-900 text-canvas hover:bg-ink-700 active:scale-[0.98]',
  accent: 'bg-clay-500 text-white hover:bg-clay-600 active:scale-[0.98]',
  outline: 'border border-ink-300 bg-transparent text-ink-800 hover:border-ink-900 hover:bg-ink-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {children}
    </Link>
  );
}
