import { api } from './client';
import type { ApiItemResponse, HeroSlide } from '@/types';

export const heroApi = {
  /** Active hero slides for the home carousel, in display order. */
  async list(): Promise<HeroSlide[]> {
    const { data } = await api.get<ApiItemResponse<HeroSlide[]>>('/hero-slides');
    return data.data;
  },
};
