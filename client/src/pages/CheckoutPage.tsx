import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCart } from '@/features/cart/cartSlice';
import { paymentsApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { FormField } from '@/components/auth/FormField';
import { formatPrice } from '@/lib/format';
import { productImage, onImageError } from '@/lib/product';
import { loadScript } from '@/lib/loadScript';
import { required, isPhone, isPincode } from '@/lib/validate';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Address, Order } from '@/types';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

const emptyAddress: AddressForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

type FieldErrors = Partial<Record<keyof AddressForm, string>>;

/**
 * Real checkout: collects a delivery address, sizes a Razorpay order from
 * the server-computed quote, and opens Razorpay's Checkout widget. Nothing
 * is charged or reserved until the payment is verified server-side —
 * `paymentsApi.verify` is what actually creates the order.
 */
export function CheckoutPage() {
  usePageTitle('Checkout');
  const dispatch = useAppDispatch();
  const { items, subtotal, count } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);

  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [placed, setPlaced] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof AddressForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!required(form.fullName)) next.fullName = 'Full name is required';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid 10-digit phone number';
    if (!required(form.line1)) next.line1 = 'Address is required';
    if (!required(form.city)) next.city = 'City is required';
    if (!isPincode(form.postalCode)) next.postalCode = 'Enter a valid 6-digit PIN code';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  const payNow = async () => {
    if (placing) return;
    setError(null);
    if (!validate()) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setPlacing(true);
    try {
      const address: Address = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim(),
        country: 'IN',
      };

      const quote = await paymentsApi.checkout({ address });
      await loadScript(RAZORPAY_SCRIPT_SRC);

      const rzp = new window.Razorpay({
        key: quote.keyId,
        amount: Math.round(quote.amount * 100),
        currency: quote.currency,
        name: 'S2VESTIS',
        description: `${quote.orderSummary.itemCount} item(s)`,
        order_id: quote.razorpayOrderId,
        prefill: { name: address.fullName, email: user?.email, contact: address.phone },
        theme: { color: '#1c1917' },
        handler: (response) => {
          void (async () => {
            try {
              const order = await paymentsApi.verify(response);
              setPlaced(order);
              dispatch(fetchCart()); // resync Redux — the cart was already cleared server-side
            } catch (e) {
              setError(toErrorMessage(e));
            } finally {
              setPlacing(false);
            }
          })();
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });
      rzp.open();
    } catch (e) {
      setError(toErrorMessage(e));
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <CheckCircle2 className="h-14 w-14 text-sage-500" />
        <h1 className="mt-5 text-3xl font-bold text-ink-900">Order confirmed</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500">
          Thanks for your order — a confirmation has been sent to your account.
        </p>
        <p className="mt-4 rounded-pill bg-ink-100 px-4 py-1.5 text-sm font-semibold text-ink-700">
          Order {placed.orderNumber}
        </p>

        <div className="mt-8 w-full max-w-md rounded-card border border-ink-100 bg-surface p-5 text-left">
          <ul className="divide-y divide-ink-100">
            {placed.items.map((line, i) => (
              <li key={`${line.slug}-${i}`} className="flex items-center gap-3 py-3">
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
                  {formatPrice(line.price * line.quantity)}
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
          <Link to={`/account/orders/${placed._id}`} className="btn-primary">
            View order
          </Link>
          <Link to="/products" className="btn-outline">
            Continue shopping
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
        Secure payment via Razorpay
      </p>

      {error && (
        <p className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ink-400">
              Delivery address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full name"
                value={form.fullName}
                onChange={setField('fullName')}
                error={fieldErrors.fullName}
                autoComplete="name"
                className="sm:col-span-2"
              />
              <FormField
                label="Phone"
                value={form.phone}
                onChange={setField('phone')}
                error={fieldErrors.phone}
                autoComplete="tel"
                inputMode="numeric"
              />
              <FormField
                label="PIN code"
                value={form.postalCode}
                onChange={setField('postalCode')}
                error={fieldErrors.postalCode}
                autoComplete="postal-code"
                inputMode="numeric"
              />
              <FormField
                label="Address line 1"
                value={form.line1}
                onChange={setField('line1')}
                error={fieldErrors.line1}
                autoComplete="address-line1"
                className="sm:col-span-2"
              />
              <FormField
                label="Address line 2 (optional)"
                value={form.line2}
                onChange={setField('line2')}
                autoComplete="address-line2"
                className="sm:col-span-2"
              />
              <FormField
                label="City"
                value={form.city}
                onChange={setField('city')}
                error={fieldErrors.city}
                autoComplete="address-level2"
              />
              <FormField
                label="State (optional)"
                value={form.state}
                onChange={setField('state')}
                autoComplete="address-level1"
              />
            </div>
          </section>

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
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            count={count}
            showShippingNudge={false}
            action={{
              label: placing ? 'Opening payment…' : 'Pay with Razorpay',
              onClick: payNow,
              disabled: placing,
            }}
          >
            <p className="mt-3 text-center text-[11px] text-ink-400">
              You'll be redirected to Razorpay's secure checkout to complete payment.
            </p>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
