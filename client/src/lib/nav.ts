import type { Gender } from '@/types';

export interface NavCategory {
  name: string;
  slug: string;
}

/** Fallback category list — mirrors the seed data. Live data replaces this when the API responds. */
export const FALLBACK_CATEGORIES: NavCategory[] = [
  { name: 'T-Shirts', slug: 't-shirts' },
  { name: 'Polo', slug: 'polo' },
  { name: 'Tees', slug: 'tees' },
  { name: 'Shirts', slug: 'shirts' },
  { name: 'Linen Shirts', slug: 'linen-shirts' },
  { name: 'Sportswear', slug: 'sportswear' },
  { name: 'Sweatshirts', slug: 'sweatshirts' },
  { name: 'Hoodies', slug: 'hoodies' },
];

export const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
];

/** Build a /products URL with filters pre-applied. */
export function productsHref(params: {
  category?: string;
  gender?: Gender;
  search?: string;
  sort?: string;
}): string {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.gender) qs.set('gender', params.gender);
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  const s = qs.toString();
  return s ? `/products?${s}` : '/products';
}
