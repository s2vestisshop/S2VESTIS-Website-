import { api } from './client';
import type {
  ApiItemResponse,
  ApiListResponse,
  Pagination,
  Product,
  ProductQuery,
} from '@/types';

function toParams(query: ProductQuery): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = String(value);
  }
  return params;
}

export const productsApi = {
  async list(query: ProductQuery = {}): Promise<{ products: Product[]; pagination: Pagination }> {
    const { data } = await api.get<ApiListResponse<Product>>('/products', {
      params: toParams(query),
    });
    return { products: data.data, pagination: data.pagination };
  },

  async getBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<ApiItemResponse<Product>>(`/products/${slug}`);
    return data.data;
  },

  async related(slug: string): Promise<Product[]> {
    const { data } = await api.get<ApiItemResponse<Product[]>>(`/products/${slug}/related`);
    return data.data;
  },
};
