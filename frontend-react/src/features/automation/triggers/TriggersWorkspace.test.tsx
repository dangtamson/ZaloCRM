import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { apiClient } from '../../../api/client';
import TriggersWorkspace from './TriggersWorkspace';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('TriggersWorkspace', () => {
  it('loads trigger catalog and can create, disable and run a trigger', async () => {
    const calls: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push(`${config.method} ${config.url}`);
      if (config.url === '/automation/triggers/catalog') return response(config, { catalog: [{ eventType: 'birthday', title: 'Sinh nhật', category: 'general' }] });
      if (config.url === '/automation/triggers') {
        if (config.method === 'get') return response(config, { triggers: [{ id: 't1', name: 'Chào khách mới', eventType: 'contact_created', bindingKind: 'sequence', enabled: true }] });
        if (config.method === 'post') return response(config, { id: 't2', name: 'Trig mới', eventType: 'birthday', bindingKind: 'block', enabled: true });
      }
      if (config.url === '/automation/sequences') return response(config, { sequences: [{ id: 's1', name: 'Sequence 1', steps: [] }] });
      if (config.url === '/automation/blocks') return response(config, { blocks: [{ id: 'b1', name: 'Block 1', actionType: 'send_message' }] });
      if (config.url === '/customer-lists') return response(config, { lists: [] });
      if (config.url === '/automation/triggers/t1/disable') return response(config, { id: 't1', enabled: false });
      if (config.url === '/automation/triggers/t1/run') return response(config, { accepted: true, triggerId: 't1', eventType: 'manual_run' });
      return response(config, {});
    };

    render(<TriggersWorkspace />);

    expect(await screen.findByText('Chào khách mới')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tạo trigger' }));
    await userEvent.type(screen.getByLabelText('Tên trigger'), 'Trig mới');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu trigger' }));
    await userEvent.click(screen.getByRole('button', { name: 'Chạy Trig mới' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tắt Chào khách mới' }));

    expect(calls).toContain('post /automation/triggers');
    expect(calls).toContain('post /automation/triggers/t2/run');
    expect(calls).toContain('post /automation/triggers/t1/disable');
  });
});
