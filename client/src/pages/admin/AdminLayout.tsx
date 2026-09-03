import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Tags } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageFallback } from '@/components/common/PageFallback';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tags, end: false },
];

export function AdminLayout() {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-ink-400">
          Admin
        </p>
        <nav className="flex gap-1 lg:flex-col">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-ink-900 text-canvas' : 'text-ink-700 hover:bg-ink-100'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
