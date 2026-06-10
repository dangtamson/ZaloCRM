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
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
  });

  it('renders analytics data and saves a custom report', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/analytics/conversion-funnel') {
        return response(config, { stages: [{ status: 'Mới', count: 10, rate: 100 }], totalContacts: 10, avgConversionDays: 2 });
      }
      if (config.url === '/analytics/team-performance') {
        return response(config, { users: [{ userId: 'u1', fullName: 'Owner', messagesSent: 20, contactsConverted: 2, appointmentsCompleted: 1, avgResponseTime: 120 }] });
      }
      if (config.url === '/analytics/response-time') {
        return response(config, { daily: [{ date: '2026-06-10', avgSeconds: 120 }], overall: 120, byUser: [] });
      }
      if (config.url === '/saved-reports' && config.method === 'get') {
        return response(config, { data: [] });
      }
      if (config.url === '/saved-reports' && config.method === 'post') {
        return response(config, { id: 'report-1', name: 'Báo cáo tuần', type: 'custom', config: {}, createdAt: '2026-06-10' });
      }
      return response(config, {});
    };

    render(<RouterProvider router={createMemoryAppRouter(['/analytics'])} />);

    expect(await screen.findByText('Mới')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Tên báo cáo'), 'Báo cáo tuần');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu báo cáo' }));

    expect(await screen.findByText('Báo cáo tuần')).toBeInTheDocument();
  });
});
