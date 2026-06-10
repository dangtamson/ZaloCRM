import React from 'react';
import { act, render, screen } from '@testing-library/react';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../api/client';
import { emitChatSocketForTest } from '../hooks/chatSocket';
import { createMemoryAppRouter } from '../router';
import { authStore } from '../store/auth';
import { privacyStore } from '../store/privacy';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('ChatPage', () => {
  beforeEach(() => {
    authStore.setState({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', orgId: 'org', orgName: 'VNPT' },
    });
    privacyStore.setState({ activeSessionCount: 0, activeSessions: [] });
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

  it('appends realtime socket messages to the selected thread', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/conversations') {
        return response(config, {
          conversations: [{ id: 'c1', threadType: 'user', contact: { id: 'ct1', fullName: 'Realtime User' }, unreadCount: 0 }],
        });
      }
      return response(config, { messages: [] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/chat/c1'])} />);

    expect(await screen.findByText('Realtime User')).toBeInTheDocument();
    act(() => {
      emitChatSocketForTest('chat:message', {
        conversationId: 'c1',
        message: { id: 'm2', content: 'Tin realtime', contentType: 'text', senderType: 'customer', senderName: 'Realtime User', sentAt: '2026-06-10T07:02:00Z', isDeleted: false, zaloMsgId: null },
      });
    });

    expect(await screen.findByText('Tin realtime')).toBeInTheDocument();
  });

  it('keeps redacted message content hidden while privacy is locked', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/conversations') {
        return response(config, {
          conversations: [{ id: 'c1', threadType: 'user', contact: { id: 'ct1', fullName: 'Locked User' }, unreadCount: 0 }],
        });
      }
      return response(config, { messages: [{ id: 'm5', content: 'Bi mat', contentType: 'text', senderType: 'customer', senderName: 'Locked User', sentAt: '2026-06-10T07:04:00Z', isDeleted: false, zaloMsgId: null, redacted: true }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/chat/c1'])} />);

    expect(await screen.findByText('Tin nhắn riêng tư')).toBeInTheDocument();
    expect(screen.queryByText('Bi mat')).not.toBeInTheDocument();
  });

  it('renders composer tools expected by chat users', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/conversations') {
        return response(config, {
          conversations: [{ id: 'c1', threadType: 'user', contact: { id: 'ct1', fullName: 'Tool User' }, unreadCount: 0 }],
        });
      }
      return response(config, { messages: [] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/chat/c1'])} />);

    expect(await screen.findByText('Tool User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emoji' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sticker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument();
  });

  it('sends composer content to the selected conversation', async () => {
    const user = userEvent.setup();
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/conversations') {
        return response(config, {
          conversations: [{ id: 'c1', threadType: 'user', contact: { id: 'ct1', fullName: 'Composer User' }, unreadCount: 0 }],
        });
      }
      if (config.url === '/conversations/c1/messages' && config.method === 'post') {
        expect(JSON.parse(String(config.data))).toEqual({ content: 'Phan hoi moi' });
        return response(config, { id: 'm3', content: 'Phan hoi moi', contentType: 'text', senderType: 'self', senderName: 'Owner', sentAt: '2026-06-10T07:03:00Z', isDeleted: false, zaloMsgId: null });
      }
      return response(config, { messages: [] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/chat/c1'])} />);

    expect(await screen.findByText('Composer User')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Nhập tin nhắn...'), 'Phan hoi moi');
    await user.click(screen.getByRole('button', { name: 'Gửi' }));

    expect(await screen.findByText('Phan hoi moi')).toBeInTheDocument();
  });

  it('reveals redacted message content when privacy is unlocked', async () => {
    privacyStore.setState({
      activeSessionCount: 1,
      activeSessions: [{ id: 's1', expiresAt: '2099-01-01T00:00:00Z', userAgent: null, ipAddress: null, unlockedAt: '2026-06-10T07:00:00Z' }],
    });
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/conversations') {
        return response(config, {
          conversations: [{ id: 'c1', threadType: 'user', contact: { id: 'ct1', fullName: 'Private User' }, unreadCount: 0 }],
        });
      }
      return response(config, { messages: [{ id: 'm4', content: 'Noi dung rieng', contentType: 'text', senderType: 'customer', senderName: 'Private User', sentAt: '2026-06-10T07:04:00Z', isDeleted: false, zaloMsgId: null, redacted: true }] });
    };

    render(<RouterProvider router={createMemoryAppRouter(['/chat/c1'])} />);

    expect(await screen.findByText('Noi dung rieng')).toBeInTheDocument();
  });
});
