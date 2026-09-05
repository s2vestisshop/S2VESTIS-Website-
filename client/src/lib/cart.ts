import type { CartItem } from '@/types';

/** Free shipping at or above this order value (after discounts). */
export const FREE_SHIP_THRESHOLD = 1999;
/** Flat shipping fee below the free-shipping threshold. */
export const FLAT_SHIPPING = 99;

export interface CartTotals {
  /** line items priced at full MRP (pre-discount) */
  mrpSubtotal: number;
  /** line items priced at what's actually charged */
  subtotal: number;
  /** mrpSubtotal − subtotal, never negative */
  savings: number;
  shipping: number;
  freeShipping: boolean;
  /** amount still needed to unlock free shipping (0 once reached) */
  awayFromFreeShip: number;
  total: number;
  count: number;
}

/**
 * Single source of truth for the cart money breakdown used by the cart page,
 * checkout and the drawer. `subtotalOverride` (the store's authoritative
 * subtotal from the API) wins over the sum computed from line items.
 */
export function cartTotals(items: CartItem[], subtotalOverride?: number): CartTotals {
  let mrpSubtotal = 0;
  let lineSum = 0;
  let count = 0;

  for (const item of items) {
    const qty = item.quantity;
    const mrp = item.product?.price ?? item.priceAtAdd;
    mrpSubtotal += mrp * qty;
    lineSum += item.priceAtAdd * qty;
    count += qty;
  }

  const subtotal = subtotalOverride ?? lineSum;
  // guard against a price change since the item was added
  if (mrpSubtotal < subtotal) mrpSubtotal = subtotal;

  const savings = Math.max(0, mrpSubtotal - subtotal);
  const freeShipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0;
  const shipping = freeShipping ? 0 : FLAT_SHIPPING;

  return {
    mrpSubtotal,
    subtotal,
    savings,
    shipping,
    freeShipping,
    awayFromFreeShip: Math.max(0, FREE_SHIP_THRESHOLD - subtotal),
    total: subtotal + shipping,
    count,
  };
}

/** Per-line saving vs MRP (never negative). */
export function lineSavings(item: CartItem): number {
  const mrp = item.product?.price ?? item.priceAtAdd;
  return Math.max(0, (mrp - item.priceAtAdd) * item.quantity);
}
