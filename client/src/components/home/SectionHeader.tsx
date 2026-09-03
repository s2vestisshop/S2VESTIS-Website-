import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function SectionHeader({
  title,
  subtitle,
  linkText,
  linkTo,
  className,
}: {
  title: string;
  subtitle?: string;
  linkText?: string;
  linkTo?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {linkText && linkTo && (
        <Link
          to={linkTo}
          className="shrink-0 text-sm font-semibold text-clay-600 link-underline"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
