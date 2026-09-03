import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

/**
 * Gates a route on auth state. `requireAdmin` additionally checks role.
 * Waits for the initial `fetchMe` before deciding, to avoid a redirect flash.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const location = useLocation();
  const { user, initialized } = useAppSelector((s) => s.auth);

  if (!initialized) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
