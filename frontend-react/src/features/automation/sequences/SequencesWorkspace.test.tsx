import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { apiClient } from '../../../api/client';
import SequencesWorkspace from './SequencesWorkspace';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('SequencesWorkspace', () => {
  it('loads sequences and creates a sequence with one step', async () => {
    const payloads: unknown[] = [];
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/automation/sequences' && config.method === 'get') return response(config, { sequences: [{ id: 's1', name: 'Chăm sóc mới', steps: [], enabled: true }] });
      if (config.url === '/automation/blocks' && config.method === 'get') return response(config, { blocks: [{ id: 'b1', name: 'Tin chào', actionType: 'send_message' }] });
      if (config.url === '/automation/sequences' && config.method === 'post') {
        payloads.push(JSON.parse(String(config.data)));
        return response(config, { id: 's2', name: 'Chuỗi mới', steps: [{ stepId: '1', blockId: 'b1', delayMinutes: 30 }], enabled: false });
      }
      return response(config, {});
    };

    render(<SequencesWorkspace />);

    expect(await screen.findByText('Chăm sóc mới')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tạo sequence' }));
    await userEvent.type(screen.getByLabelText('Tên sequence'), 'Chuỗi mới');
    await userEvent.click(screen.getByRole('button', { name: 'Thêm bước' }));
    fireEvent.change(screen.getByLabelText('Delay phút'), { target: { value: '30' } });
    await userEvent.click(screen.getByRole('button', { name: 'Lưu sequence' }));

    expect(payloads[0]).toMatchObject({
      name: 'Chuỗi mới',
      steps: [{ blockId: 'b1', delayMinutes: 30 }],
    });
  });
});
