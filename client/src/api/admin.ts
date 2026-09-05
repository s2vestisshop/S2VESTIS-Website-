import { api } from './client';
import type {
  AdminOrder,
  Announcement,
  ApiItemResponse,
  ApiListResponse,
  Category,
  HeroSlide,
  Pagination,
  Product,
} from '@/types';

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalCategories: number;
  totalUsers: number;
  totalOrders: number;
  lowStockThreshold: number;
  lowStockCount: number;
  lowStock: { _id: string; name: string; slug: string; stock: number }[];
}

export interface AdminProductQuery {
  search?: string;
  category?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface AdminOrderQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  async stats(): Promise<AdminStats> {
    const { data } = await api.get<ApiItemResponse<AdminStats>>('/admin/stats');
    return data.data;
  },

  async listProducts(
    query: AdminProductQuery = {}
  ): Promise<{ products: Product[]; pagination: Pagination }> {
    const { data } = await api.get<ApiListResponse<Product>>('/admin/products', { params: query });
    return { products: data.data, pagination: data.pagination };
  },

  async getProduct(id: string): Promise<Product> {
    const { data } = await api.get<ApiItemResponse<Product>>(`/admin/products/${id}`);
    return data.data;
  },

  async createProduct(payload: Partial<Product>): Promise<Product> {
    const { data } = await api.post<ApiItemResponse<Product>>('/admin/products', payload);
    return data.data;
  },

  async updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
    const { data } = await api.put<ApiItemResponse<Product>>(`/admin/products/${id}`, payload);
    return data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  },

  async listCategories(): Promise<Category[]> {
    const { data } = await api.get<ApiItemResponse<Category[]>>('/admin/categories');
    return data.data;
  },

  async createCategory(payload: Partial<Category>): Promise<Category> {
    const { data } = await api.post<ApiItemResponse<Category>>('/admin/categories', payload);
    return data.data;
  },

  async updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
    const { data } = await api.put<ApiItemResponse<Category>>(`/admin/categories/${id}`, payload);
    return data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`);
  },

  async listHeroSlides(): Promise<HeroSlide[]> {
    const { data } = await api.get<ApiItemResponse<HeroSlide[]>>('/admin/hero-slides');
    return data.data;
  },

  async createHeroSlide(payload: Partial<HeroSlide>): Promise<HeroSlide> {
    const { data } = await api.post<ApiItemResponse<HeroSlide>>('/admin/hero-slides', payload);
    return data.data;
  },

  async updateHeroSlide(id: string, payload: Partial<HeroSlide>): Promise<HeroSlide> {
    const { data } = await api.put<ApiItemResponse<HeroSlide>>(`/admin/hero-slides/${id}`, payload);
    return data.data;
  },

  async deleteHeroSlide(id: string): Promise<void> {
    await api.delete(`/admin/hero-slides/${id}`);
  },

  async reorderHeroSlides(ids: string[]): Promise<HeroSlide[]> {
    const { data } = await api.put<ApiItemResponse<HeroSlide[]>>('/admin/hero-slides/reorder', {
      ids,
    });
    return data.data;
  },

  async listAnnouncements(): Promise<Announcement[]> {
    const { data } = await api.get<ApiItemResponse<Announcement[]>>('/admin/announcements');
    return data.data;
  },

  async createAnnouncement(payload: Partial<Announcement>): Promise<Announcement> {
    const { data } = await api.post<ApiItemResponse<Announcement>>('/admin/announcements', payload);
    return data.data;
  },

  async updateAnnouncement(id: string, payload: Partial<Announcement>): Promise<Announcement> {
    const { data } = await api.put<ApiItemResponse<Announcement>>(
      `/admin/announcements/${id}`,
      payload
    );
    return data.data;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await api.delete(`/admin/announcements/${id}`);
  },

  async reorderAnnouncements(ids: string[]): Promise<Announcement[]> {
    const { data } = await api.put<ApiItemResponse<Announcement[]>>('/admin/announcements/reorder', {
      ids,
    });
    return data.data;
  },

  async listOrders(
    query: AdminOrderQuery = {}
  ): Promise<{ orders: AdminOrder[]; pagination: Pagination }> {
    const { data } = await api.get<ApiListResponse<AdminOrder>>('/admin/orders', { params: query });
    return { orders: data.data, pagination: data.pagination };
  },

  async getOrder(id: string): Promise<AdminOrder> {
    const { data } = await api.get<ApiItemResponse<AdminOrder>>(`/admin/orders/${id}`);
    return data.data;
  },

  async updateOrderStatus(id: string, status: string, note?: string): Promise<AdminOrder> {
    const { data } = await api.put<ApiItemResponse<AdminOrder>>(`/admin/orders/${id}/status`, {
      status,
      note,
    });
    return data.data;
  },

  async retryShipment(id: string): Promise<AdminOrder> {
    const { data } = await api.post<ApiItemResponse<AdminOrder>>(`/admin/orders/${id}/create-shipment`);
    return data.data;
  },

  async upload(files: File[]): Promise<string[]> {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    const { data } = await api.post<{ success: boolean; storage: string; urls: string[] }>(
      '/admin/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.urls;
  },
};
