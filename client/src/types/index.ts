export type Gender = 'men' | 'women' | 'unisex';
export type Role = 'user' | 'admin';

export interface SizeStock {
  size: string;
  stock: number;
}

export interface Variant {
  _id?: string;
  color: string;
  colorHex: string;
  images: string[];
  sizes: SizeStock[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  gender: Gender;
  image?: string;
  isActive?: boolean;
  productCount?: number;
}

export interface Rating {
  avg: number;
  count: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: Category | string;
  gender: Gender;
  price: number;
  discountPrice: number | null;
  discountPercent: number;
  effectivePrice: number;
  variants: Variant[];
  rating: Rating;
  isFeatured: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
}

export interface CartItem {
  _id: string;
  product: Product;
  color: string;
  size: string;
  quantity: number;
  priceAtAdd: number;
  lineTotal: number;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  subtotal: number;
  count: number;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface WishlistPayload {
  _id: string;
  products: Product[];
  count: number;
}

export interface ProductQuery {
  category?: string;
  gender?: Gender;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  ids?: string;
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'popularity';
  page?: number;
  limit?: number;
  featured?: boolean;
}

// ---- API envelope shapes ----
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}
