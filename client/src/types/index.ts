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

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
}

export type OrderStatus =
  | 'demo-placed'
  | 'pending-payment'
  | 'paid'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered';

export interface ShipmentEvent {
  status: string;
  description: string | null;
  occurredAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  itemCount: number;
  total: number;
  status: OrderStatus;
  address: Address | null;
  paymentMethod: string | null;
  paidAt: string | null;
  paymentReviewRequired: boolean;
  awbCode: string | null;
  courierName: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryDate: string | null;
  events: ShipmentEvent[];
  createdAt: string;
}

// ---- admin order management ----
export interface AdminOrder extends Order {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  paymentReviewNote: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  shiprocketOrderId: string | null;
  shiprocketShipmentId: string | null;
  customer: { id: string; name: string; email: string };
}

// ---- payments (Razorpay) ----
export interface CheckoutQuote {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderSummary: {
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    total: number;
    itemCount: number;
  };
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
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
