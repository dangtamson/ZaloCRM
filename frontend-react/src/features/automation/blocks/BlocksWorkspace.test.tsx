import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { apiClient } from '../../../api/client';
import BlocksWorkspace from './BlocksWorkspace';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('BlocksWorkspace', () => {
  it('loads blocks and archives a block', async () => {
    const calls: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push(`${config.method} ${config.url}`);
      if (config.url === '/automation/blocks') return response(config, { blocks: [{ id: 'b1', name: 'Tin chào', actionType: 'send_message', usageCount: 2 }] });
      if (config.url === '/automation/block-folders') return response(config, { folders: [] });
      if (config.url === '/automation/blocks/b1/archive') return response(config, { id: 'b1', name: 'Tin chào', actionType: 'send_message', archivedAt: '2026-06-10T00:00:00.000Z' });
      return response(config, {});
    };

    render(<BlocksWorkspace />);

    expect(await screen.findByText('Tin chào')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Lưu trữ Tin chào' }));

    expect(calls).toContain('post /automation/blocks/b1/archive');
  });

  it('creates a send message block', async () => {
    const payloads: unknown[] = [];
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/automation/blocks' && config.method === 'get') return response(config, { blocks: [] });
      if (config.url === '/automation/block-folders') return response(config, { folders: [] });
      if (config.url === '/automation/blocks' && config.method === 'post') {
        payloads.push(JSON.parse(String(config.data)));
        return response(config, { id: 'b2', name: 'Block mới', actionType: 'send_message' });
      }
      return response(config, {});
    };

    render(<BlocksWorkspace />);

    await userEvent.click(await screen.findByRole('button', { name: 'Tạo block' }));
    await userEvent.type(screen.getByLabelText('Tên block'), 'Block mới');
    fireEvent.change(screen.getByLabelText('Nội dung tin nhắn'), { target: { value: 'Xin chào {{name}}' } });
    await userEvent.click(screen.getByRole('button', { name: 'Lưu block' }));

    expect(payloads[0]).toMatchObject({ name: 'Block mới', actionType: 'send_message', content: { textVariants: ['Xin chào {{name}}'] } });
  });
});
