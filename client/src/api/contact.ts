import { api } from './client';

export const contactApi = {
  async send(payload: { name: string; email: string; message: string }): Promise<void> {
    await api.post('/contact', payload);
  },
};
