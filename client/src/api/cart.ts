import { api } from './client';
import type { Cart } from '@/types';

interface CartResponse {
  success: boolean;
  cart: Cart;
}

export interface AddToCartInput {
  productId: string;
  color: string;
  size: string;
  quantity?: number;
}

export const cartApi = {
  async get(): Promise<Cart> {
    const { data } = await api.get<CartResponse>('/cart');
    return data.cart;
  },

  async add(input: AddToCartInput): Promise<Cart> {
    const { data } = await api.post<CartResponse>('/cart/add', input);
    return data.cart;
  },

  async update(itemId: string, quantity: number): Promise<Cart> {
    const { data } = await api.put<CartResponse>('/cart/update', { itemId, quantity });
    return data.cart;
  },

  async remove(itemId: string): Promise<Cart> {
    const { data } = await api.delete<CartResponse>(`/cart/remove/${itemId}`);
    return data.cart;
  },

  async clear(): Promise<Cart> {
    const { data } = await api.delete<CartResponse>('/cart/clear');
    return data.cart;
  },
};
