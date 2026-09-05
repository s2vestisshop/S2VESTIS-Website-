import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openCartDrawer, setMobileMenu } from '@/features/ui/uiSlice';
import { logout } from '@/features/auth/authSlice';
import { useCategories } from '@/hooks/useCategories';
import { GENDERS, productsHref } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/common/Logo';
import { MegaMenu } from './MegaMenu';

function IconButton({
  label,
  onClick,
  to,
  badge,
  children,
}: {
  label: string;
  onClick?: () => void;
  to?: string;
  badge?: number;
  children: React.ReactNode;
}) {
  const inner = (
    <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100">
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
  );
  return to ? (
    <Link to={to} aria-label={label} className="focus-visible:rounded-full">
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className="focus-visible:rounded-full">
      {inner}
    </button>
  );
}

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const cartCount = useAppSelector((s) => s.cart.count);
  const wishlistCount = useAppSelector((s) => s.wishlist.ids.length);
  const user = useAppSelector((s) => s.auth.user);
  const mobileMenuOpen = useAppSelector((s) => s.ui.mobileMenuOpen);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [term, setTerm] = useState('');
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openMenu = () => {
    window.clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 120);
  };
  // A tap fires a synthetic hover (openMenu) immediately followed by a click —
  // if click also navigated away, the menu would flash open and be
  // unreachable on touch. Toggling on click instead makes tap reliably open
  // (and re-tapping close) the menu on any device; "View everything" inside
  // the menu covers the old "go straight to /products" shortcut.
  const toggleMenu = () => {
    window.clearTimeout(closeTimer.current);
    setMenuOpen((v) => !v);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(productsHref({ search: q || undefined }));
    setTerm('');
    dispatch(setMobileMenu(false));
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-canvas/90 backdrop-blur transition-shadow duration-300',
        scrolled && 'shadow-[0_1px_0_rgba(23,22,20,0.08)]'
      )}
    >
      {/* announcement strip */}
      <div className="bg-ink-900 text-canvas">
        <p className="container-page py-2 text-center text-[11px] font-medium uppercase tracking-widest">
          Free shipping over ₹1999 · Easy 15-day returns
        </p>
      </div>

      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          {/* left: mobile menu + nav */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-100 lg:hidden"
              aria-label="Open menu"
              onClick={() => dispatch(setMobileMenu(true))}
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav
              className="hidden items-center gap-6 lg:flex"
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className="py-2 text-sm font-medium text-ink-800 link-underline"
                onMouseEnter={openMenu}
                onFocus={openMenu}
                onClick={toggleMenu}
                aria-expanded={menuOpen}
              >
                Shop
              </button>
              {GENDERS.map((g) => (
                <Link
                  key={g.value}
                  to={productsHref({ gender: g.value })}
                  className="py-2 text-sm font-medium text-ink-700 link-underline hover:text-ink-900"
                >
                  {g.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* center: logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>

          {/* right: search + icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <form onSubmit={submitSearch} className="hidden lg:block">
              <label className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search"
                  className="h-10 w-40 rounded-pill border border-ink-200 bg-surface pl-9 pr-3 text-sm placeholder:text-ink-400 focus:w-56 focus:border-ink-400 focus:outline-none focus-visible:ring-0"
                />
              </label>
            </form>

            <IconButton label="Wishlist" to="/wishlist" badge={wishlistCount}>
              <Heart className="h-5 w-5" />
            </IconButton>

            <IconButton
              label="Open cart"
              onClick={() => dispatch(openCartDrawer())}
              badge={cartCount}
            >
              <ShoppingBag className="h-5 w-5" />
            </IconButton>

            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <IconButton label="Account" to={user ? '/account' : '/login'}>
                <User className="h-5 w-5" />
              </IconButton>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full w-52 rounded-card border border-ink-100 bg-surface p-2 shadow-soft"
                  >
                    {user ? (
                      <>
                        <p className="px-3 py-2 text-xs text-ink-400">
                          Signed in as
                          <br />
                          <span className="font-semibold text-ink-800">{user.email}</span>
                        </p>
                        <MenuLink to="/account">Account</MenuLink>
                        <MenuLink to="/wishlist">Wishlist</MenuLink>
                        {user.role === 'admin' && <MenuLink to="/admin">Admin panel</MenuLink>}
                        <button
                          onClick={() => dispatch(logout())}
                          className="w-full rounded px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100"
                        >
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <MenuLink to="/login">Sign in</MenuLink>
                        <MenuLink to="/register">Create account</MenuLink>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* desktop mega menu */}
      <AnimatePresence>
        {menuOpen && (
          <div onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
            <MegaMenu categories={categories} onNavigate={() => setMenuOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            categories={categories}
            term={term}
            setTerm={setTerm}
            onSearch={submitSearch}
            onClose={() => dispatch(setMobileMenu(false))}
            user={user}
            onLogout={() => dispatch(logout())}
          />
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-100">
      {children}
    </Link>
  );
}

function MobileMenu({
  categories,
  term,
  setTerm,
  onSearch,
  onClose,
  user,
  onLogout,
}: {
  categories: { name: string; slug: string }[];
  term: string;
  setTerm: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onClose: () => void;
  user: { email: string; role: string } | null;
  onLogout: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={false}>
      <motion.div
        className="absolute inset-0 bg-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-canvas shadow-drawer"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <Logo onClick={onClose} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form onSubmit={onSearch} className="mb-6">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products"
                className="h-11 w-full rounded-pill border border-ink-200 bg-surface pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
              />
            </div>
          </form>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">Shop</p>
          <ul className="mb-6 space-y-1">
            {GENDERS.map((g) => (
              <li key={g.value}>
                <Link
                  to={productsHref({ gender: g.value })}
                  onClick={onClose}
                  className="block rounded px-2 py-2 text-[15px] text-ink-800 hover:bg-ink-100"
                >
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">
            Categories
          </p>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to={productsHref({ category: c.slug })}
                  onClick={onClose}
                  className="block rounded px-2 py-2 text-[15px] text-ink-800 hover:bg-ink-100"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-ink-100 px-5 py-4">
          {user ? (
            <div className="space-y-1">
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="block rounded px-2 py-2 text-sm text-ink-800 hover:bg-ink-100"
                >
                  Admin panel
                </Link>
              )}
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="block w-full rounded px-2 py-2 text-left text-sm text-ink-800 hover:bg-ink-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={onClose}
                className="btn-outline flex-1 text-center"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="btn-primary flex-1 text-center"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}
