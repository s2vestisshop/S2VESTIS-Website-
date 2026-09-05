import type { OrderStatus } from '@/types';

interface StatusInfo {
  label: string;
  badgeClass: string;
}

const STATUS_INFO: Record<OrderStatus, StatusInfo> = {
  'demo-placed': { label: 'Placed', badgeClass: 'bg-sage-100 text-sage-700' },
  'pending-payment': { label: 'Pending payment', badgeClass: 'bg-clay-100 text-clay-700' },
  paid: { label: 'Paid', badgeClass: 'bg-sage-100 text-sage-700' },
  fulfilled: { label: 'Fulfilled', badgeClass: 'bg-sage-100 text-sage-700' },
  shipped: { label: 'Shipped', badgeClass: 'bg-sage-100 text-sage-700' },
  out_for_delivery: { label: 'Out for delivery', badgeClass: 'bg-sage-100 text-sage-700' },
  delivered: { label: 'Delivered', badgeClass: 'bg-sage-100 text-sage-700' },
  cancelled: { label: 'Cancelled', badgeClass: 'bg-danger/10 text-danger' },
  refunded: { label: 'Refunded', badgeClass: 'bg-danger/10 text-danger' },
};

export function orderStatusInfo(status: OrderStatus | string): StatusInfo {
  return STATUS_INFO[status as OrderStatus] ?? { label: status, badgeClass: 'bg-ink-100 text-ink-700' };
}

/** Canonical customer-facing delivery lifecycle, in order — used to render a
 * timeline (each step is "done" once the order's status/timestamps reach it). */
export const DELIVERY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'paid', label: 'Order placed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];
