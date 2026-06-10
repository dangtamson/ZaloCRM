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

describe('CRM core routes', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
  });

  it('loads contacts from the contacts API', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/contacts');
      return response(config, { data: [{ id: 'c1', name: 'Nguyen Van A', phone: '0900000000', status: 'Mới' }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/contacts'])} />);

    expect(await screen.findByText('Nguyen Van A')).toBeInTheDocument();
    expect(screen.getByText('0900000000')).toBeInTheDocument();
  });

  it('loads friends from the friends API', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/friends');
      return response(config, { data: [{ id: 'f1', displayName: 'Bạn Zalo', phone: '0911111111', relationshipKind: 'friend' }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/friends'])} />);

    expect(await screen.findByText('Bạn Zalo')).toBeInTheDocument();
    expect(screen.getByText('friend')).toBeInTheDocument();
  });

  it('loads groups from the groups API', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/groups');
      return response(config, { data: [{ id: 'g1', name: 'Nhóm kinh doanh', membersCount: 12 }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/groups'])} />);

    expect(await screen.findByText('Nhóm kinh doanh')).toBeInTheDocument();
    expect(screen.getByText('12 thành viên')).toBeInTheDocument();
  });
});
