import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearCart } from '@/features/cart/cartSlice';
import { ordersApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { formatPrice } from '@/lib/format';
import { productImage, onImageError } from '@/lib/product';

interface PlacedLine {
  key: string;
  name?: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  lineTotal: number;
}
interface Placed {
  orderNumber: string;
  orderId?: string;
  lines: PlacedLine[];
  total: number;
}

/**
 * DEMO checkout. No payment capture, no address. For a signed-in user it
 * persists a demo Order (visible under /account/orders) and clears the cart
 * server-side; for a guest it just shows a local confirmation.
 */
export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const { items, subtotal, count } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);

  const [placed, setPlaced] = useState<Placed | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestOrderNumber = useMemo(
    () => `S2V-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
    []
  );

  const placeOrder = async () => {
    if (placing) return;
    setPlacing(true);
    setError(null);
    try {
      if (user) {
        const order = await ordersApi.create();
        setPlaced({
          orderNumber: order.orderNumber,
          orderId: order._id,
          total: order.total,
          lines: order.items.map((it, i) => ({
            key: `${it.slug}-${i}`,
            name: it.name,
            image: it.image,
            color: it.color,
            size: it.size,
            quantity: it.quantity,
            lineTotal: it.price * it.quantity,
          })),
        });
      } else {
        setPlaced({
          orderNumber: guestOrderNumber,
          total: subtotal,
          lines: items.map((it) => ({
            key: it._id,
            name: it.product?.name,
            image: it.product ? productImage(it.product) : '',
            color: it.color,
            size: it.size,
            quantity: it.quantity,
            lineTotal: it.lineTotal,
          })),
        });
      }
      dispatch(clearCart());
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <CheckCircle2 className="h-14 w-14 text-sage-500" />
        <h1 className="mt-5 text-3xl font-bold text-ink-900">Order placed (demo)</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500">
          This is a demonstration checkout — no payment was taken and nothing will ship. Real
          payment and delivery tracking are planned for a later release.
        </p>
        <p className="mt-4 rounded-pill bg-ink-100 px-4 py-1.5 text-sm font-semibold text-ink-700">
          Order {placed.orderNumber}
        </p>

        <div className="mt-8 w-full max-w-md rounded-card border border-ink-100 bg-surface p-5 text-left">
          <ul className="divide-y divide-ink-100">
            {placed.lines.map((line) => (
              <li key={line.key} className="flex items-center gap-3 py-3">
                <img
                  src={line.image}
                  onError={onImageError}
                  alt=""
                  className="h-14 w-11 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-ink-900">{line.name}</p>
                  <p className="text-xs text-ink-500">
                    {line.color} · {line.size} · Qty {line.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink-900">
                  {formatPrice(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 text-sm font-bold text-ink-900">
            <span>Total</span>
            <span>{formatPrice(placed.total)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {placed.orderId && (
            <Link to={`/account/orders/${placed.orderId}`} className="btn-primary">
              View order
            </Link>
          )}
          <Link to="/products" className={placed.orderId ? 'btn-outline' : 'btn-primary'}>
            Continue shopping
          </Link>
          {!placed.orderId && (
            <Link to="/" className="btn-outline">
              Back to home
            </Link>
          )}
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
      {!user && (
        <p className="mt-2 text-xs text-ink-400">
          <Link to="/login" state={{ from: '/checkout' }} className="text-clay-600 underline">
            Sign in
          </Link>{' '}
          to save this order to your account.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

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
            action={{
              label: placing ? 'Placing…' : 'Place order (demo)',
              onClick: placeOrder,
              disabled: placing,
            }}
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
