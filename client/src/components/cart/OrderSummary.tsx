import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/format';

const FREE_SHIP_THRESHOLD = 1999;
const FLAT_SHIPPING = 99;

interface Props {
  subtotal: number;
  count: number;
  /** primary action button */
  action?: { label: string; to?: string; onClick?: () => void; disabled?: boolean };
  /** show the "X away from free shipping" nudge */
  showShippingNudge?: boolean;
  children?: React.ReactNode;
}

export function OrderSummary({
  subtotal,
  count,
  action,
  showShippingNudge = true,
  children,
}: Props) {
  const freeShipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0;
  const away = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const shipping = freeShipping ? 0 : FLAT_SHIPPING;
  const total = subtotal + shipping;

  return (
    <div className="rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-400">
        Order summary
      </h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
          <dd className="font-medium text-ink-900">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Shipping</dt>
          <dd className="font-medium text-ink-900">
            {subtotal === 0 ? '—' : freeShipping ? 'Free' : formatPrice(shipping)}
          </dd>
        </div>
      </dl>

      {showShippingNudge && !freeShipping && away > 0 && (
        <p className="mt-3 rounded-card bg-ink-50 px-3 py-2 text-xs text-ink-600">
          You're {formatPrice(away)} away from free shipping.
        </p>
      )}

      <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
        <span className="text-sm font-semibold text-ink-900">Total to pay</span>
        <span className="text-lg font-bold text-ink-900">{formatPrice(total)}</span>
      </div>
      <p className="mt-1 text-[11px] text-ink-400">Includes shipping.</p>

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
