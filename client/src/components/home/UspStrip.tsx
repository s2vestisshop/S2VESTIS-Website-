import { RefreshCw, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';

const ITEMS: { icon: LucideIcon; title: string; copy: string }[] = [
  { icon: Truck, title: 'Free shipping', copy: 'On all orders over ₹1999' },
  { icon: RefreshCw, title: 'Easy returns', copy: '15-day no-questions returns' },
  { icon: ShieldCheck, title: 'Secure checkout', copy: 'Your data stays protected' },
];

export function UspStrip() {
  return (
    <section className="border-y border-ink-100 bg-surface">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{title}</p>
              <p className="text-xs text-ink-500">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
