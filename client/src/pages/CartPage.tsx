import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/cartSlice';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { Skeleton } from '@/components/ui/Skeleton';

export function CartPage() {
  const dispatch = useAppDispatch();
  const { items, subtotal, count, status, pendingItemIds } = useAppSelector((s) => s.cart);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const loading = status === 'loading' && items.length === 0;

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Your cart</h1>

      {loading ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-36 w-28" />
                <div className="flex-1 space-y-3 py-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-card border border-ink-100 bg-surface px-6 py-24 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
            <ShoppingBag className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-lg font-semibold text-ink-900">Your cart is empty</p>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            Once you add something, it'll show up here.
          </p>
          <Link to="/products" className="btn-primary mt-6">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-ink-500">
                {count} {count === 1 ? 'item' : 'items'}
              </p>
              {confirmClear ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-ink-500">Clear cart?</span>
                  <button
                    onClick={() => {
                      dispatch(clearCart());
                      setConfirmClear(false);
                    }}
                    className="font-semibold text-danger hover:underline"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-ink-500 hover:underline"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-ink-500 underline-offset-2 hover:text-danger hover:underline"
                >
                  Clear cart
                </button>
              )}
            </div>

            <ul className="divide-y divide-ink-100 border-y border-ink-100">
              {items.map((item) => (
                <li key={item._id}>
                  <CartLineItem
                    item={item}
                    pending={pendingItemIds.includes(item._id)}
                    onQty={(q) => dispatch(updateCartItem({ itemId: item._id, quantity: q }))}
                    onRemove={() => dispatch(removeCartItem(item._id))}
                  />
                </li>
              ))}
            </ul>

            <Link
              to="/products"
              className="mt-6 inline-block text-sm font-semibold text-clay-600 link-underline"
            >
              ← Continue shopping
            </Link>
          </section>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <OrderSummary
              subtotal={subtotal}
              count={count}
              action={{ label: 'Proceed to checkout', to: '/checkout' }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
