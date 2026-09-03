import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="text-xl" />
          <h1 className="mt-6 text-2xl font-bold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
        </div>

        <div className="rounded-card border border-ink-100 bg-surface p-6 shadow-soft sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>
      </div>
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-clay-600 link-underline">
      {children}
    </Link>
  );
}
