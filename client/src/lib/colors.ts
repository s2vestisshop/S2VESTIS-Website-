/**
 * Colour swatches offered in the gallery filter. Names match the seed data so
 * the `?color=` query filters correctly. Extend this list as the catalogue grows.
 */
export interface ColorOption {
  name: string;
  hex: string;
}

export const FILTER_COLORS: ColorOption[] = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#F7F7F5' },
  { name: 'Navy', hex: '#1F2A44' },
  { name: 'Charcoal', hex: '#3A3A3A' },
  { name: 'Beige', hex: '#D8C7A9' },
  { name: 'Olive Green', hex: '#5A5F3C' },
  { name: 'Forest Green', hex: '#2E4034' },
  { name: 'Sky Blue', hex: '#8FB8DE' },
  { name: 'Maroon', hex: '#5E1F2B' },
  { name: 'Rust', hex: '#A5522D' },
  { name: 'Powder Pink', hex: '#E7C6C9' },
  { name: 'Lilac', hex: '#C3B1D9' },
];

export const FILTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const PRICE_BOUNDS = { min: 0, max: 5000, step: 100 };
