import { api } from './client';
import type { User } from '@/types';

interface AuthResponse {
  success: boolean;
  user: User | null;
}

export const authApi = {
  async me(): Promise<User | null> {
    const { data } = await api.get<AuthResponse>('/auth/me');
    return data.user;
  },

  async login(payload: { email: string; password: string }): Promise<User> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data.user as User;
  },

  async register(payload: { name: string; email: string; password: string }): Promise<User> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data.user as User;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
