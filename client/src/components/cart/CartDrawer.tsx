import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { closeCartDrawer } from '@/features/ui/uiSlice';
import { removeCartItem, updateCartItem } from '@/features/cart/cartSlice';
import { formatPrice, pluralize } from '@/lib/format';
import { productImage } from '@/lib/product';
import { QuantityStepper } from './QuantityStepper';
import type { CartItem } from '@/types';

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.cartDrawerOpen);
  const { items, subtotal, count, pendingItemIds } = useAppSelector((s) => s.cart);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch(closeCartDrawer());
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dispatch]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCartDrawer())}
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-canvas shadow-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                Cart{' '}
                <span className="text-ink-400">
                  ({count} {pluralize(count, 'item')})
                </span>
              </h2>
              <button
                onClick={() => dispatch(closeCartDrawer())}
                aria-label="Close cart"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <EmptyCart onClose={() => dispatch(closeCartDrawer())} />
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-5">
                  {items.map((item) => (
                    <CartLine
                      key={item._id}
                      item={item}
                      pending={pendingItemIds.includes(item._id)}
                      onQty={(q) => dispatch(updateCartItem({ itemId: item._id, quantity: q }))}
                      onRemove={() => dispatch(removeCartItem(item._id))}
                    />
                  ))}
                </ul>

                <footer className="border-t border-ink-100 px-5 py-5">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink-500">Subtotal</span>
                    <span className="font-semibold text-ink-900">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-xs text-ink-400">
                    Shipping &amp; taxes calculated at checkout.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/cart"
                      onClick={() => dispatch(closeCartDrawer())}
                      className="btn-outline text-center"
                    >
                      View Cart
                    </Link>
                    <Link
                      to="/checkout"
                      onClick={() => dispatch(closeCartDrawer())}
                      className="btn-primary text-center"
                    >
                      Checkout
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function CartLine({
  item,
  pending,
  onQty,
  onRemove,
}: {
  item: CartItem;
  pending: boolean;
  onQty: (q: number) => void;
  onRemove: () => void;
}) {
  const product = item.product;
  return (
    <li className="flex gap-4 py-4">
      <Link
        to={`/products/${product?.slug ?? ''}`}
        className="h-24 w-20 shrink-0 overflow-hidden rounded-card bg-ink-100"
      >
        {product && (
          <img
            src={productImage(product)}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/products/${product?.slug ?? ''}`}
            className="line-clamp-2 text-sm font-medium text-ink-900 hover:underline"
          >
            {product?.name ?? 'Product'}
          </Link>
          <button
            onClick={onRemove}
            disabled={pending}
            className="shrink-0 text-xs text-ink-400 underline-offset-2 hover:text-danger hover:underline disabled:opacity-40"
          >
            Remove
          </button>
        </div>

        <p className="mt-0.5 text-xs text-ink-400">
          {item.color} · {item.size}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            onChange={onQty}
            disabled={pending}
            max={20}
          />
          <span className="text-sm font-semibold text-ink-900">{formatPrice(item.lineTotal)}</span>
        </div>
      </div>
    </li>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
        <ShoppingBag className="h-7 w-7 text-ink-400" />
      </div>
      <p className="text-base font-semibold text-ink-900">Your cart is empty</p>
      <p className="mt-1 text-sm text-ink-500">Add a few essentials to get started.</p>
      <Link to="/products" onClick={onClose} className="btn-primary mt-6">
        Start shopping
      </Link>
    </div>
  );
}
