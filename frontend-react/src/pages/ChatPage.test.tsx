import React from 'react';
import { render, screen } from '@testing-library/react';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../api/client';
import { createMemoryAppRouter } from '../router';
import { authStore } from '../store/auth';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('ChatPage', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
  });

  it('loads conversations and selected thread messages', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/conversations') {
        return response(config, {
          conversations: [
            { id: 'c1', threadType: 'user', contact: { id: 'ct1', fullName: 'Khach Chat', phone: '0909999999' }, unreadCount: 2, lastMessageAt: '2026-06-10T07:00:00Z' },
          ],
        });
      }
      expect(config.url).toBe('/conversations/c1/messages');
      return response(config, { messages: [{ id: 'm1', content: 'Xin chao', contentType: 'text', senderType: 'customer', senderName: 'Khach Chat', sentAt: '2026-06-10T07:01:00Z', isDeleted: false, zaloMsgId: null }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/chat/c1'])} />);

    expect(await screen.findByText('Khach Chat')).toBeInTheDocument();
    expect(await screen.findByText('Xin chao')).toBeInTheDocument();
    expect(screen.getByText('0909999999')).toBeInTheDocument();
  });
});
