import type { Product, Variant } from '@/types';
import { FILTER_SIZES } from '@/lib/colors';

export interface SizeDraft {
  size: string;
  stock: string; // kept as string for controlled inputs; coerced on submit
}

export interface VariantDraft {
  color: string;
  colorHex: string;
  images: string[];
  sizes: SizeDraft[];
}

export interface ProductDraft {
  name: string;
  description: string;
  category: string;
  gender: 'men' | 'women' | 'unisex';
  price: string;
  discountPrice: string;
  isFeatured: boolean;
  variants: VariantDraft[];
}

export function emptySizeRows(): SizeDraft[] {
  return FILTER_SIZES.map((size) => ({ size, stock: '0' }));
}

export function emptyVariant(): VariantDraft {
  return { color: '', colorHex: '#111111', images: [], sizes: emptySizeRows() };
}

export function blankDraft(): ProductDraft {
  return {
    name: '',
    description: '',
    category: '',
    gender: 'unisex',
    price: '',
    discountPrice: '',
    isFeatured: false,
    variants: [emptyVariant()],
  };
}

export function draftFromProduct(p: Product): ProductDraft {
  return {
    name: p.name,
    description: p.description ?? '',
    category: typeof p.category === 'object' ? p.category._id : p.category,
    gender: p.gender,
    price: String(p.price),
    discountPrice: p.discountPrice != null ? String(p.discountPrice) : '',
    isFeatured: p.isFeatured,
    variants: p.variants.map((v: Variant) => ({
      color: v.color,
      colorHex: v.colorHex,
      images: [...v.images],
      sizes: v.sizes.map((s) => ({ size: s.size, stock: String(s.stock) })),
    })),
  };
}

/** Convert a draft to the API payload, or return a list of validation errors. */
export function draftToPayload(d: ProductDraft, isActive: boolean) {
  const errors: string[] = [];

  if (!d.name.trim()) errors.push('Name is required.');
  if (!d.category) errors.push('Choose a category.');
  const price = Number(d.price);
  if (!d.price || Number.isNaN(price) || price < 0) errors.push('Enter a valid price.');
  const discountPrice = d.discountPrice.trim() === '' ? null : Number(d.discountPrice);
  if (discountPrice !== null) {
    if (Number.isNaN(discountPrice) || discountPrice < 0) errors.push('Discount price is invalid.');
    else if (discountPrice >= price) errors.push('Discount price must be below the base price.');
  }
  if (d.variants.length === 0) errors.push('Add at least one colour variant.');

  const variants = d.variants.map((v, i) => {
    if (!v.color.trim()) errors.push(`Variant ${i + 1}: colour name is required.`);
    if (!v.colorHex.trim()) errors.push(`Variant ${i + 1}: colour swatch is required.`);
    if (v.images.length === 0) errors.push(`Variant ${i + 1}: add at least one image.`);
    const sizes = v.sizes
      .filter((s) => s.size.trim() !== '')
      .map((s) => ({ size: s.size.trim(), stock: Math.max(0, Math.round(Number(s.stock) || 0)) }));
    if (sizes.length === 0) errors.push(`Variant ${i + 1}: add at least one size row.`);
    return { color: v.color.trim(), colorHex: v.colorHex.trim(), images: v.images, sizes };
  });

  if (errors.length) return { errors, payload: null as null };

  return {
    errors: [] as string[],
    payload: {
      name: d.name.trim(),
      description: d.description.trim(),
      category: d.category,
      gender: d.gender,
      price,
      discountPrice,
      isFeatured: d.isFeatured,
      isActive,
      variants,
    },
  };
}
