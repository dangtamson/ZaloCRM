import React from 'react';
import { render, screen } from '@testing-library/react';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../api/client';
import { authStore } from '../store/auth';
import { createMemoryAppRouter } from '../router';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
  });

  it('renders KPI and dashboard chart summaries from API data', async () => {
    apiClient.defaults.adapter = async (config) => {
      const dataByUrl: Record<string, unknown> = {
        '/dashboard/kpi': {
          messagesToday: 12,
          messagesUnreplied: 3,
          messagesUnread: 5,
          appointmentsToday: 2,
          newContactsThisWeek: 9,
          totalContacts: 120,
        },
        '/dashboard/message-volume': { data: [{ date: '2026-06-10', sent: 7, received: 5 }] },
        '/dashboard/pipeline': [{ status: 'Quan tâm', _count: { _all: 4 } }],
        '/dashboard/sources': [{ source: 'Facebook', _count: { _all: 6 } }],
        '/dashboard/appointments': [{ status: 'scheduled', _count: { _all: 2 } }],
      };
      return response(config, dataByUrl[config.url ?? '']);
    };

    render(<RouterProvider router={createMemoryAppRouter(['/'])} />);

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('Tin nhắn hôm nay')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10')).toBeInTheDocument();
    expect(screen.getByText('Quan tâm')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
  });
});
