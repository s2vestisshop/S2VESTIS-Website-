import { api } from './client';
import type { Address, ApiItemResponse, CheckoutQuote, Order, VerifyPaymentInput } from '@/types';

export const paymentsApi = {
  async checkout(payload: { address: Address; couponCode?: string }): Promise<CheckoutQuote> {
    const { data } = await api.post<ApiItemResponse<CheckoutQuote>>('/payments/checkout', payload);
    return data.data;
  },

  async verify(payload: VerifyPaymentInput): Promise<Order> {
    const { data } = await api.post<ApiItemResponse<Order>>('/payments/verify', payload);
    return data.data;
  },
};
