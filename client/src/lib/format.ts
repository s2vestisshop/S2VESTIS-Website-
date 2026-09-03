const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Prices are stored as whole rupees in the API. */
export function formatPrice(value: number): string {
  return currency.format(Math.round(value));
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return n === 1 ? singular : plural;
}
