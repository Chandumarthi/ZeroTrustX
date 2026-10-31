import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '../types';

let memoryToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  memoryToken = token;
  if (token) {
    localStorage.setItem('ztx_token', token);
  } else {
    localStorage.removeItem('ztx_token');
  }
};

export const getAuthToken = (): string | null => {
  if (memoryToken) return memoryToken;
  const stored = localStorage.getItem('ztx_token');
  if (stored) {
    memoryToken = stored;
  }
  return memoryToken;
};

export const clearAuthToken = (): void => {
  memoryToken = null;
  localStorage.removeItem('ztx_token');
};

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const normalizedBaseUrl = rawBaseUrl
  ? rawBaseUrl.endsWith('/api')
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/+$/, '')}/api`
  : '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

apiClient.interceptors.response.use(
  (response) => {
    // If response matches ApiResponse shape, return response.data
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      // Only redirect if not already on auth/landing pages
      const currentPath = window.location.pathname;
      if (
        !['/login', '/register', '/verify-otp', '/', '/access-denied', '/session-expired'].includes(
          currentPath
        )
      ) {
        window.location.href = `/session-expired?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(normalizeApiError(error));
  }
);

export function normalizeApiError(error: any): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    const detailMsg =
      Array.isArray(data?.details) && data.details.length > 0
        ? data.details.map((d: any) => d.message || `${d.field}: invalid`).join(', ')
        : undefined;

    return {
      message:
        detailMsg ||
        data?.error ||
        data?.message ||
        error.message ||
        'An unexpected network error occurred',
      code: data?.code || error.code || 'NETWORK_ERROR',
      status: error.response?.status || 500,
      errors: data?.errors,
    };
  }

  return {
    message: error?.message || 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    status: 500,
  };
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> =>
    apiClient.get(url, { params }),

  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.post(url, data),

  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.put(url, data),

  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data),

  delete: <T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> =>
    apiClient.delete(url, { params }),
};

export default api;
