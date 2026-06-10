import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthStore, type AuthApi } from './auth';

const userPayload = {
  id: 'user-1',
  email: 'owner@example.com',
  fullName: 'Owner User',
  role: 'owner',
  orgId: 'org-1',
  org: {
    name: 'VNPT',
    timezone: '+07:00',
  },
};

function makeApi(overrides: Partial<AuthApi> = {}): AuthApi {
  return {
    get: vi.fn(async () => ({ data: userPayload })),
    post: vi.fn(async () => ({
      data: {
        token: 'new-token',
        user: {
          id: 'user-1',
          email: 'owner@example.com',
          fullName: 'Owner User',
          role: 'owner',
          orgId: 'org-1',
          orgName: 'VNPT',
        },
      },
    })),
    ...overrides,
  };
}

describe('createAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logs in, persists the token, and hydrates the authenticated user', async () => {
    const api = makeApi();
    const store = createAuthStore(api);

    await store.getState().login('owner@example.com', 'secret');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'owner@example.com',
      password: 'secret',
    });
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(store.getState().token).toBe('new-token');
    expect(store.getState().user?.email).toBe('owner@example.com');
    expect(store.getState().isAuthenticated()).toBe(true);
    expect(store.getState().isOwner()).toBe(true);
    expect(store.getState().isAdmin()).toBe(true);
  });

  it('fetches the profile and maps organization fields from the backend shape', async () => {
    const api = makeApi();
    const store = createAuthStore(api);

    await store.getState().fetchProfile();

    expect(api.get).toHaveBeenCalledWith('/profile');
    expect(store.getState().user).toEqual({
      id: 'user-1',
      email: 'owner@example.com',
      fullName: 'Owner User',
      role: 'owner',
      orgId: 'org-1',
      orgName: 'VNPT',
      orgTimezone: '+07:00',
    });
  });

  it('clears session state when profile loading fails', async () => {
    localStorage.setItem('token', 'stale-token');
    const api = makeApi({
      get: vi.fn(async () => {
        throw new Error('401');
      }),
    });
    const store = createAuthStore(api);

    await store.getState().fetchProfile();

    expect(localStorage.getItem('token')).toBeNull();
    expect(store.getState().token).toBe('');
    expect(store.getState().user).toBeNull();
  });
});
