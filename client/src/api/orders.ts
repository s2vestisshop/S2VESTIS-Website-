import { api } from './client';
import type { ApiItemResponse, Order } from '@/types';

export const ordersApi = {
  async create(): Promise<Order> {
    const { data } = await api.post<ApiItemResponse<Order>>('/orders');
    return data.data;
  },

  async list(): Promise<Order[]> {
    const { data } = await api.get<ApiItemResponse<Order[]>>('/orders');
    return data.data;
  },

  async get(id: string): Promise<Order> {
    const { data } = await api.get<ApiItemResponse<Order>>(`/orders/${id}`);
    return data.data;
  },
};
