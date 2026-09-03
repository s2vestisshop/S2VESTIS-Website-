import type { Product, Variant } from '@/types';

const PLACEHOLDER = 'https://placehold.co/900x1200/E7E4DE/8B8375?text=S2VESTIS';

export function primaryVariant(product: Product): Variant | undefined {
  return product.variants?.[0];
}

export function variantImage(variant: Variant | undefined, index = 0): string {
  return variant?.images?.[index] ?? variant?.images?.[0] ?? PLACEHOLDER;
}

export function productImage(product: Product, index = 0): string {
  return variantImage(primaryVariant(product), index);
}

export function isDiscounted(product: Product): boolean {
  return product.discountPrice != null && product.discountPercent > 0;
}

export function totalStock(product: Product): number {
  return (product.variants ?? []).reduce(
    (sum, v) => sum + v.sizes.reduce((s, r) => s + (r.stock || 0), 0),
    0
  );
}

export function isInStock(product: Product): boolean {
  return totalStock(product) > 0;
}

/** Distinct colour swatches across all variants. */
export function colorSwatches(product: Product): { color: string; colorHex: string }[] {
  const seen = new Set<string>();
  const out: { color: string; colorHex: string }[] = [];
  for (const v of product.variants ?? []) {
    if (!seen.has(v.color)) {
      seen.add(v.color);
      out.push({ color: v.color, colorHex: v.colorHex });
    }
  }
  return out;
}

/** Sizes available (stock > 0) for a given colour, or across all variants. */
export function sizesForColor(product: Product, color?: string): string[] {
  const seen = new Set<string>();
  for (const v of product.variants ?? []) {
    if (color && v.color !== color) continue;
    for (const s of v.sizes) if (s.stock > 0) seen.add(s.size);
  }
  return [...seen];
}

export const PLACEHOLDER_IMAGE = PLACEHOLDER;

/** <img onError> handler — swap a failed image for the placeholder once. */
export function onImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
}
