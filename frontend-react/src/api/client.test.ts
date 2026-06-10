import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';

function okResponse(config: AxiosRequestConfig): AxiosResponse {
  return {
    data: { ok: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as AxiosResponse['config'],
  };
}

describe('createApiClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('attaches the bearer token from storage to outgoing requests', async () => {
    localStorage.setItem('token', 'jwt-token');
    const client = createApiClient({ getToken: () => localStorage.getItem('token') });
    let authorizationHeader: unknown;

    client.defaults.adapter = async (config) => {
      authorizationHeader = config.headers?.Authorization;
      return okResponse(config);
    };

    await client.get('/profile');

    expect(authorizationHeader).toBe('Bearer jwt-token');
  });

  it('clears the token and redirects to login on protected-route 401 responses', async () => {
    localStorage.setItem('token', 'expired-token');
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      getToken: () => localStorage.getItem('token'),
      clearToken: () => localStorage.removeItem('token'),
      getCurrentPath: () => '/contacts',
      onUnauthorized,
    });

    client.defaults.adapter = async (config) => {
      const response = {
        data: { message: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as AxiosResponse;
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    };

    await expect(client.get('/profile')).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem('token')).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledWith('/login');
  });

  it('does not redirect away from auth routes on 401 responses', async () => {
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      getToken: () => 'expired-token',
      clearToken: vi.fn(),
      getCurrentPath: () => '/login',
      onUnauthorized,
    });

    client.defaults.adapter = async (config) => {
      const response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as AxiosResponse;
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    };

    await expect(client.get('/profile')).rejects.toBeInstanceOf(AxiosError);

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
