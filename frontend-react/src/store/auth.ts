import type { AxiosInstance } from 'axios';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { apiClient } from '../api/client';
import type { AuthResponse, BackendProfile, SetupInput, User } from '../types/auth';

export type AuthApi = Pick<AxiosInstance, 'get' | 'post'>;

export interface AuthState {
  user: User | null;
  token: string;
  needsSetup: boolean;
  isAuthenticated: () => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  checkSetup: () => Promise<boolean>;
  setup: (input: SetupInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('token') ?? '';
}

function persistToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('token', token);
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('token');
}

function mapProfile(data: BackendProfile): User {
  return {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    orgId: data.orgId,
    orgName: data.org?.name ?? '',
    orgTimezone: data.org?.timezone ?? '+07:00',
  };
}

function applyAuthResponse(response: AuthResponse, set: StoreApi<AuthState>['setState']): void {
  persistToken(response.token);
  set({ token: response.token, user: response.user });
}

export function createAuthStore(api: AuthApi = apiClient): StoreApi<AuthState> {
  return createStore<AuthState>()((set, get) => ({
    user: null,
    token: getStoredToken(),
    needsSetup: false,
    isAuthenticated: () => Boolean(get().token && get().user),
    isOwner: () => get().user?.role === 'owner',
    isAdmin: () => ['owner', 'admin'].includes(get().user?.role ?? ''),
    checkSetup: async () => {
      const { data } = await api.get<{ needsSetup: boolean }>('/setup/status');
      set({ needsSetup: data.needsSetup });
      return data.needsSetup;
    },
    setup: async (input) => {
      const { data } = await api.post<AuthResponse>('/setup', input);
      applyAuthResponse(data, set);
    },
    login: async (email, password) => {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      applyAuthResponse(data, set);
    },
    fetchProfile: async () => {
      try {
        const { data } = await api.get<BackendProfile>('/profile');
        set({ user: mapProfile(data) });
      } catch {
        get().logout();
      }
    },
    logout: () => {
      clearStoredToken();
      set({ token: '', user: null });
    },
    init: async () => {
      if (get().token) {
        await get().fetchProfile();
      }
    },
  }));
}

export const authStore = createAuthStore();

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  return useStore(authStore, selector);
}
