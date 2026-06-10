import React from 'react';
import { render, screen } from '@testing-library/react';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../api/client';
import { createMemoryAppRouter } from '../../router';
import { authStore } from '../../store/auth';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('automation routes', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
  });

  it('loads bot triggers from the automation API', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/automation/triggers');
      return response(config, { triggers: [{ id: 't1', name: 'Chào khách mới', eventType: 'contact_created', enabled: true }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/automation/bot/triggers'])} />);

    expect(await screen.findByText('Chào khách mới')).toBeInTheDocument();
    expect(screen.getByText('contact_created')).toBeInTheDocument();
  });

  it('loads customer lists for bot automation', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/customer-lists');
      return response(config, { lists: [{ id: 'l1', name: 'Lead Facebook', totalEntries: 35, status: 'active' }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/automation/bot/lists'])} />);

    expect(await screen.findByText('Lead Facebook')).toBeInTheDocument();
    expect(screen.getByText('35 dòng')).toBeInTheDocument();
  });

  it('loads a customer list detail table', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/customer-lists/l1') {
        return response(config, { list: { id: 'l1', name: 'Lead Facebook', totalEntries: 1, status: 'active' } });
      }
      expect(config.url).toBe('/customer-lists/l1/entries');
      return response(config, { entries: [{ id: 'e1', displayName: 'Nguyen Lead', phone: '0988888888', status: 'new' }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/automation/bot/lists/l1'])} />);

    expect(await screen.findByText('Nguyen Lead')).toBeInTheDocument();
    expect(screen.getByText('0988888888')).toBeInTheDocument();
  });
});
