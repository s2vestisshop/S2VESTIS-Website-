import { api } from './client';
import type { Announcement, ApiItemResponse } from '@/types';

export const announcementsApi = {
  /** Active top-bar messages, in display order. */
  async list(): Promise<Announcement[]> {
    const { data } = await api.get<ApiItemResponse<Announcement[]>>('/announcements');
    return data.data;
  },
};
