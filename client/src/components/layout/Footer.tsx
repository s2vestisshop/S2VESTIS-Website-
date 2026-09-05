import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Check } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { productsHref } from '@/lib/nav';

const COMPANY = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Stores', to: '/stores' },
  { label: 'Sustainability', to: '/sustainability' },
];

const HELP = [
  { label: 'Shipping & Returns', to: '/shipping' },
  { label: 'Size Guide', to: '/size-guide' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Track Order', to: '/track' },
];

const CONTACT_EMAIL = 'subhamkr756@gmail.com';
const SOCIAL = {
  instagram: 'https://www.instagram.com/s2vestis?igsi=MTJiYXl4Zzh3cHp0NA==',
  youtube: 'https://youtube.com/@s2vestis?si=f6RqvLA7V2R_0Ib6',
};

export function Footer() {
  const { categories } = useCategories();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // UI only — no email service wired up yet
    setDone(true);
    setEmail('');
    window.setTimeout(() => setDone(false), 3500);
  };

  return (
    <footer className="mt-24 border-t border-ink-100 bg-canvas">
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="font-display text-xl font-bold tracking-[0.12em] text-ink-900">
              S2VESTIS
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              Premium Clothing Co. · Estd. 2024
            </p>
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              Considered apparel — everyday essentials cut from premium fabric and built to last
              wash after wash.
            </p>
            <p className="mt-3 text-sm text-ink-500">
              Questions?{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-ink-700 underline-offset-2 hover:text-ink-900 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <form onSubmit={submit} className="mt-6 max-w-sm">
              <label htmlFor="newsletter" className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                Join the list
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-11 flex-1 rounded-card border border-ink-200 bg-surface px-3 text-sm placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
                />
                <button type="submit" className="btn-primary shrink-0">
                  {done ? <Check className="h-4 w-4" /> : 'Subscribe'}
                </button>
              </div>
              {done && (
                <p className="mt-2 text-xs text-sage-600">Thanks — you're on the list.</p>
              )}
            </form>
          </div>

          <FooterCol title="Shop">
            {categories.slice(0, 6).map((c) => (
              <FooterLink key={c.slug} to={productsHref({ category: c.slug })}>
                {c.name}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Company">
            {COMPANY.map((l) => (
              <FooterLink key={l.to} to={l.to}>
                {l.label}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Help">
            {HELP.map((l) => (
              <FooterLink key={l.to} to={l.to}>
                {l.label}
              </FooterLink>
            ))}
          </FooterCol>
        </div>

        <div className="mt-14 flex flex-col-reverse items-center justify-between gap-6 border-t border-ink-100 pt-8 sm:flex-row">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} S2VESTIS. All rights reserved. ·{' '}
            <Link to="/privacy" className="hover:text-ink-700">
              Privacy Policy
            </Link>{' '}
            ·{' '}
            <Link to="/terms" className="hover:text-ink-700">
              Terms &amp; Conditions
            </Link>
          </p>
          <div className="flex items-center gap-4 text-ink-500">
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-ink-900"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hover:text-ink-900"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-400">{title}</p>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-ink-600 transition-colors hover:text-ink-900">
        {children}
      </Link>
    </li>
  );
}
