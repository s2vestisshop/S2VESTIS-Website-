import { api } from './client';
import type { ApiItemResponse, WishlistPayload } from '@/types';

export const wishlistApi = {
  async get(): Promise<WishlistPayload> {
    const { data } = await api.get<ApiItemResponse<WishlistPayload>>('/wishlist');
    return data.data;
  },

  async add(productId: string): Promise<WishlistPayload> {
    const { data } = await api.post<ApiItemResponse<WishlistPayload>>('/wishlist/add', {
      productId,
    });
    return data.data;
  },

  async remove(productId: string): Promise<WishlistPayload> {
    const { data } = await api.delete<ApiItemResponse<WishlistPayload>>(
      `/wishlist/remove/${productId}`
    );
    return data.data;
  },
};
