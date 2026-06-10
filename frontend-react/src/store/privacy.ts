import type { AxiosInstance } from 'axios';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { apiClient } from '../api/client';
import type { PrivacyStatus } from '../types/privacy';

type PrivacyApi = Pick<AxiosInstance, 'get' | 'post' | 'patch'>;

export interface PrivacyState extends PrivacyStatus {
  loading: boolean;
  lastChecked: number;
  isUnlocked: () => boolean;
  remainingMinutes: () => number;
  fetchStatus: (force?: boolean) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  unlock: (pin: string, durationMinutes: 5 | 15 | 480 | 720) => Promise<{ ok: boolean; expiresAt: string }>;
  lock: () => Promise<void>;
  flipNickPrivacyMode: (zaloAccountId: string, mode: 'main' | 'sub') => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
}

export function createPrivacyStore(api: PrivacyApi = apiClient) {
  return createStore<PrivacyState>()((set, get) => ({
    hasPin: false,
    lockedUntil: null,
    activeSessionCount: 0,
    activeSessions: [],
    loading: false,
    lastChecked: 0,
    isUnlocked: () => get().activeSessionCount > 0,
    remainingMinutes: () => {
      const firstSession = get().activeSessions[0];
      if (!firstSession) return 0;
      return Math.max(0, Math.floor((new Date(firstSession.expiresAt).getTime() - Date.now()) / 60_000));
    },
    fetchStatus: async (force = false) => {
      if (!force && Date.now() - get().lastChecked < 30_000) return;
      set({ loading: true });
      try {
        const { data } = await api.get<PrivacyStatus>('/privacy/status');
        set({ ...data, lastChecked: Date.now() });
      } finally {
        set({ loading: false });
      }
    },
    setupPin: async (pin) => {
      await api.post('/privacy/setup-pin', { pin });
      await get().fetchStatus(true);
    },
    unlock: async (pin, durationMinutes) => {
      const { data } = await api.post<{ ok: boolean; expiresAt: string }>('/privacy/unlock', { pin, durationMinutes });
      await get().fetchStatus(true);
      return data;
    },
    lock: async () => {
      try {
        await api.post('/privacy/lock');
      } finally {
        await get().fetchStatus(true);
      }
    },
    flipNickPrivacyMode: async (zaloAccountId, mode) => {
      await api.patch(`/zalo-accounts/${zaloAccountId}/privacy-mode`, { mode });
    },
    changePin: async (oldPin, newPin) => {
      await api.post('/privacy/change-pin', { oldPin, newPin });
      await get().fetchStatus(true);
    },
  }));
}

export const privacyStore = createPrivacyStore();

export function usePrivacyStore<T>(selector: (state: PrivacyState) => T): T {
  return useStore(privacyStore, selector);
}
