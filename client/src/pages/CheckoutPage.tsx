import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearCart } from '@/features/cart/cartSlice';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { formatPrice } from '@/lib/format';
import { productImage, onImageError } from '@/lib/product';
import type { CartItem } from '@/types';

/**
 * DEMO ONLY. No payment capture, no address, no real order — those land in a
 * follow-up build. This screen shows a cart summary and a fake confirmation.
 */
export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const { items, subtotal, count } = useAppSelector((s) => s.cart);

  const [placed, setPlaced] = useState<{
    id: string;
    items: CartItem[];
    total: number;
  } | null>(null);

  const orderId = useMemo(
    () => `S2V-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    []
  );

  const placeOrder = () => {
    setPlaced({ id: orderId, items, total: subtotal });
    dispatch(clearCart());
  };

  if (placed) {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <CheckCircle2 className="h-14 w-14 text-sage-500" />
        <h1 className="mt-5 text-3xl font-bold text-ink-900">Order placed (demo)</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500">
          This is a demonstration checkout — no payment was taken and nothing will ship.
          Real payment and order tracking are coming in a later release.
        </p>
        <p className="mt-4 rounded-pill bg-ink-100 px-4 py-1.5 text-sm font-semibold text-ink-700">
          Order {placed.id}
        </p>

        <div className="mt-8 w-full max-w-md rounded-card border border-ink-100 bg-surface p-5 text-left">
          <ul className="divide-y divide-ink-100">
            {placed.items.map((item) => (
              <li key={item._id} className="flex items-center gap-3 py-3">
                <img
                  src={item.product ? productImage(item.product) : ''}
                  onError={onImageError}
                  alt=""
                  className="h-14 w-11 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-ink-900">
                    {item.product?.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {item.color} · {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink-900">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 text-sm font-bold text-ink-900">
            <span>Total</span>
            <span>{formatPrice(placed.total)}</span>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link to="/products" className="btn-primary">
            Continue shopping
          </Link>
          <Link to="/" className="btn-outline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Nothing to check out</h1>
        <p className="mt-2 text-sm text-ink-500">Your cart is empty.</p>
        <Link to="/products" className="btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Checkout</h1>
      <p className="mt-2 inline-flex items-center gap-2 rounded-card bg-clay-50 px-3 py-1.5 text-xs font-medium text-clay-700">
        <Lock className="h-3.5 w-3.5" />
        Demo checkout — no payment details required
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ink-400">
            Order review
          </h2>
          <ul className="divide-y divide-ink-100 border-y border-ink-100">
            {items.map((item) => (
              <li key={item._id} className="flex gap-4 py-5">
                <img
                  src={item.product ? productImage(item.product) : ''}
                  onError={onImageError}
                  alt=""
                  className="h-24 w-20 shrink-0 rounded-card bg-ink-100 object-cover"
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-ink-900">
                      {item.product?.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {item.color} · Size {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink-900">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/cart"
            className="mt-6 inline-block text-sm font-semibold text-clay-600 link-underline"
          >
            ← Back to cart
          </Link>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary
            subtotal={subtotal}
            count={count}
            showShippingNudge={false}
            action={{ label: 'Place order (demo)', onClick: placeOrder }}
          >
            <p className="mt-3 text-center text-[11px] text-ink-400">
              By placing this demo order you agree it isn't a real purchase.
            </p>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
