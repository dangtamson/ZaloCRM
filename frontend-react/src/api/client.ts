import axios, { AxiosError, type AxiosInstance } from 'axios';

const AUTH_ROUTES = new Set(['/login', '/setup']);

export interface ApiClientOptions {
  baseURL?: string;
  timeoutMs?: number;
  getToken?: () => string | null;
  clearToken?: () => void;
  getCurrentPath?: () => string;
  onUnauthorized?: (targetPath: string) => void;
}

function defaultGetToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token');
}

function defaultClearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('token');
}

function defaultCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

function defaultUnauthorizedRedirect(targetPath: string): void {
  if (typeof window === 'undefined') return;
  window.location.assign(targetPath);
}

export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    timeout: options.timeoutMs ?? 30_000,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = (options.getToken ?? defaultGetToken)();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        (options.clearToken ?? defaultClearToken)();
        const currentPath = (options.getCurrentPath ?? defaultCurrentPath)();
        if (!AUTH_ROUTES.has(currentPath)) {
          (options.onUnauthorized ?? defaultUnauthorizedRedirect)('/login');
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
