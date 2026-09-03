import { api } from './client';
import type { ApiItemResponse, Category } from '@/types';

export const categoriesApi = {
  async list(withCounts = false): Promise<Category[]> {
    const { data } = await api.get<ApiItemResponse<Category[]>>('/categories', {
      params: withCounts ? { withCounts: 'true' } : undefined,
    });
    return data.data;
  },
};
