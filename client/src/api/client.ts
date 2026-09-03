import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // send/receive the httpOnly auth + guest cookies
  headers: { 'Content-Type': 'application/json' },
});

/** Normalised error thrown by the API layer. */
export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: { field: string; message: string }[];

  constructor(message: string, status: number, fieldErrors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    const message =
      data?.message ||
      (status === 0 ? 'Network error — is the API running?' : 'Something went wrong');
    return Promise.reject(new ApiRequestError(message, status, data?.errors));
  }
);

/** Turn any thrown value into a display string. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
