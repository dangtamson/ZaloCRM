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

describe('settings and RBAC routes', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
  });

  it('renders the settings layout for nested settings pages', async () => {
    render(<RouterProvider router={createMemoryAppRouter(['/settings/personal/profile'])} />);

    expect(await screen.findByTestId('settings-layout')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hồ sơ của tôi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'RBAC: Phòng ban' })).toHaveAttribute('href', '/settings/rbac/departments');
  });

  it('loads and renders RBAC departments from the API', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/departments');
      return response(config, {
        tree: [
          {
            id: 'dept-1',
            name: 'Kinh doanh',
            parentId: null,
            path: '/Kinh doanh',
            depth: 0,
            displayOrder: 1,
            archivedAt: null,
            memberCount: 8,
            leaderUserId: null,
            deputyUserId: null,
            children: [],
          },
        ],
      });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/settings/rbac/departments'])} />);

    expect(await screen.findByText('Kinh doanh')).toBeInTheDocument();
    expect(screen.getByText('8 thành viên')).toBeInTheDocument();
  });
});
