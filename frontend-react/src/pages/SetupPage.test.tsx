import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../api/client';
import { createMemoryAppRouter } from '../router';
import { authStore } from '../store/auth';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as AxiosResponse['config'],
  };
}

describe('SetupPage', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.setState({ token: '', user: null });
  });

  it('creates the first organization and navigates to the dashboard', async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/setup');
      expect(config.method).toBe('post');
      return response(config, {
        token: 'setup-token',
        user: {
          id: 'user-1',
          email: 'owner@example.com',
          fullName: 'Owner User',
          role: 'owner',
          orgId: 'org-1',
          orgName: 'VNPT',
        },
      });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/setup'])} />);

    await userEvent.type(screen.getByLabelText('Tên tổ chức / phòng khám'), 'VNPT');
    await userEvent.type(screen.getByLabelText('Họ tên quản trị viên'), 'Owner User');
    await userEvent.type(screen.getByLabelText('Email đăng nhập'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('setup-token');
  });
});
