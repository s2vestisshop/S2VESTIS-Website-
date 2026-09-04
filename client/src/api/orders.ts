import { api } from './client';
import type { ApiItemResponse, Order } from '@/types';

export const ordersApi = {
  // Orders are created by paymentsApi.verify now — only after a Razorpay
  // payment is confirmed — not directly here.

  async list(): Promise<Order[]> {
    const { data } = await api.get<ApiItemResponse<Order[]>>('/orders');
    return data.data;
  },

  async get(id: string): Promise<Order> {
    const { data } = await api.get<ApiItemResponse<Order>>(`/orders/${id}`);
    return data.data;
  },
};
