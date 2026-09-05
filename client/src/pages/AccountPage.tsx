import { Link, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, LogOut, Package, ShoppingBag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';

export function AccountPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const wishlistCount = useAppSelector((s) => s.wishlist.ids.length);
  const cartCount = useAppSelector((s) => s.cart.count);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const signOut = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 text-lg font-bold text-canvas">
            {initials}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">{user.name}</h1>
            <p className="text-sm text-ink-500">{user.email}</p>
            {user.role === 'admin' && (
              <span className="mt-1 inline-block rounded-pill bg-clay-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-clay-700">
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <AccountTile to="/cart" icon={ShoppingBag} label="Cart" meta={`${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} />
          <AccountTile to="/wishlist" icon={Heart} label="Wishlist" meta={`${wishlistCount} saved`} />
          <AccountTile
            to="/account/orders"
            icon={Package}
            label="Orders"
            meta="Track and review your orders"
          />
          {user.role === 'admin' && (
            <AccountTile to="/admin" icon={LayoutDashboard} label="Admin panel" meta="Manage catalogue" />
          )}
        </div>

        <button
          onClick={signOut}
          className="mt-10 inline-flex items-center gap-2 rounded-card border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:border-ink-900 hover:bg-ink-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function AccountTile({
  to,
  icon: Icon,
  label,
  meta,
  disabled,
}: {
  to: string;
  icon: typeof ShoppingBag;
  label: string;
  meta: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="text-xs text-ink-500">{meta}</p>
      </div>
    </>
  );
  const cls =
    'flex items-center gap-4 rounded-card border border-ink-100 bg-surface p-5 transition-colors';
  return disabled ? (
    <div className={`${cls} opacity-60`}>{inner}</div>
  ) : (
    <Link to={to} className={`${cls} hover:border-ink-300`}>
      {inner}
    </Link>
  );
}
