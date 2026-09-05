import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/format';
import { cartTotals } from '@/lib/cart';
import type { CartItem } from '@/types';

interface Props {
  items: CartItem[];
  /** authoritative subtotal from the store (post-discount) */
  subtotal: number;
  count: number;
  /** primary action button */
  action?: { label: string; to?: string; onClick?: () => void; disabled?: boolean };
  /** show the "X away from free shipping" nudge */
  showShippingNudge?: boolean;
  children?: React.ReactNode;
}

export function OrderSummary({
  items,
  subtotal,
  count,
  action,
  showShippingNudge = true,
  children,
}: Props) {
  const t = cartTotals(items, subtotal);

  return (
    <div className="rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-400">
        Order summary
      </h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">
            {t.savings > 0 ? 'Price' : 'Subtotal'} ({count} {count === 1 ? 'item' : 'items'})
          </dt>
          <dd className="font-medium text-ink-900">{formatPrice(t.mrpSubtotal)}</dd>
        </div>

        {t.savings > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-500">Discount</dt>
            <dd className="font-medium text-sage-600">−{formatPrice(t.savings)}</dd>
          </div>
        )}

        {t.savings > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="font-medium text-ink-900">{formatPrice(t.subtotal)}</dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-ink-500">Shipping</dt>
          <dd className="font-medium text-ink-900">
            {t.subtotal === 0 ? '—' : t.freeShipping ? 'Free' : formatPrice(t.shipping)}
          </dd>
        </div>
      </dl>

      {showShippingNudge && !t.freeShipping && t.awayFromFreeShip > 0 && (
        <p className="mt-3 rounded-card bg-ink-50 px-3 py-2 text-xs text-ink-600">
          You're {formatPrice(t.awayFromFreeShip)} away from free shipping.
        </p>
      )}

      <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
        <span className="text-sm font-semibold text-ink-900">Total to pay</span>
        <span className="text-lg font-bold text-ink-900">{formatPrice(t.total)}</span>
      </div>
      <p className="mt-1 text-[11px] text-ink-400">
        {t.subtotal === 0 || t.freeShipping ? 'Inclusive of all taxes.' : 'Includes ₹99 shipping · inclusive of all taxes.'}
      </p>

      {t.savings > 0 && (
        <p className="mt-2 rounded-card bg-sage-50 px-3 py-2 text-center text-xs font-semibold text-sage-700">
          You save {formatPrice(t.savings)} on this order
        </p>
      )}

      {action &&
        (action.to ? (
          <Link
            to={action.to}
            className="btn-primary mt-5 w-full text-center"
            aria-disabled={action.disabled}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className="btn-primary mt-5 w-full"
          >
            {action.label}
          </button>
        ))}

      {children}
    </div>
  );
}
