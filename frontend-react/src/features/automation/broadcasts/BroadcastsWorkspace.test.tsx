import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../api/client';
import BroadcastsWorkspace from './BroadcastsWorkspace';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('BroadcastsWorkspace', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads broadcasts and can create, start, pause, resume, and cancel', async () => {
    const rows = [
      {
        id: 'draft-1',
        name: 'Broadcast nháp',
        description: 'Nháp 1',
        blockId: 'block-1',
        segmentSpec: { kind: 'filter', criteria: { hasZalo: true } },
        scheduleKind: 'now',
        scheduledAt: null,
        pacing: { maxPerNickPerHour: 50, allowedHourRange: [6, 22], randomDelayBetweenSends: { min: 15, max: 45 }, distributeAcrossNicks: true },
        state: 'draft',
        totalRecipients: 12,
        sentCount: 0,
        failedCount: 0,
      },
      {
        id: 'running-1',
        name: 'Broadcast đang chạy',
        description: 'Đang chạy',
        blockId: 'block-1',
        segmentSpec: { kind: 'manual', contactIds: ['c1'] },
        scheduleKind: 'scheduled',
        scheduledAt: '2026-06-10T10:00:00Z',
        pacing: { maxPerNickPerHour: 50, allowedHourRange: [6, 22], randomDelayBetweenSends: { min: 15, max: 45 }, distributeAcrossNicks: true },
        state: 'running',
        totalRecipients: 20,
        sentCount: 5,
        failedCount: 0,
      },
      {
        id: 'paused-1',
        name: 'Broadcast tạm dừng',
        description: 'Tạm dừng',
        blockId: 'block-1',
        segmentSpec: { kind: 'manual', contactIds: ['c2'] },
        scheduleKind: 'scheduled',
        scheduledAt: '2026-06-10T11:00:00Z',
        pacing: { maxPerNickPerHour: 50, allowedHourRange: [6, 22], randomDelayBetweenSends: { min: 15, max: 45 }, distributeAcrossNicks: true },
        state: 'paused',
        totalRecipients: 20,
        sentCount: 10,
        failedCount: 1,
      },
      {
        id: 'scheduled-1',
        name: 'Broadcast lên lịch',
        description: 'Lên lịch',
        blockId: 'block-1',
        segmentSpec: { kind: 'filter', criteria: { hasZalo: true } },
        scheduleKind: 'scheduled',
        scheduledAt: '2026-06-10T12:00:00Z',
        pacing: { maxPerNickPerHour: 50, allowedHourRange: [6, 22], randomDelayBetweenSends: { min: 15, max: 45 }, distributeAcrossNicks: true },
        state: 'scheduled',
        totalRecipients: 30,
        sentCount: 0,
        failedCount: 0,
      },
    ];
    const calls: string[] = [];

    apiClient.defaults.adapter = async (config) => {
      calls.push(`${config.method} ${config.url}`);
      if (config.url === '/automation/broadcasts') {
        if (config.method === 'get') return response(config, { broadcasts: rows });
        if (config.method === 'post') {
          const created = {
            id: `draft-${rows.length + 1}`,
            name: 'Broadcast mới',
            description: '',
            blockId: 'block-1',
            segmentSpec: { kind: 'filter', criteria: { hasZalo: true } },
            scheduleKind: 'now',
            scheduledAt: null,
            pacing: { maxPerNickPerHour: 50, allowedHourRange: [6, 22], randomDelayBetweenSends: { min: 15, max: 45 }, distributeAcrossNicks: true },
            state: 'draft',
            totalRecipients: 0,
            sentCount: 0,
            failedCount: 0,
          };
          rows.unshift(created);
          return response(config, created);
        }
      }
      if (config.url === '/automation/blocks') return response(config, { blocks: [{ id: 'block-1', name: 'Block gửi tin', actionType: 'send_message', archivedAt: null }] });
      if (config.url === '/customer-lists') return response(config, { lists: [{ id: 'list-1', name: 'List khách', totalEntries: 10 }] });
      if (config.url === '/automation/broadcasts/draft-1/start') {
        const item = rows.find((row) => row.id === 'draft-1');
        if (item) item.state = 'running';
        return response(config, { ok: true, recipientsEnqueued: 8 });
      }
      if (config.url === '/automation/broadcasts/running-1/pause') {
        const item = rows.find((row) => row.id === 'running-1');
        if (item) item.state = 'paused';
        return response(config, { ok: true });
      }
      if (config.url === '/automation/broadcasts/paused-1/resume') {
        const item = rows.find((row) => row.id === 'paused-1');
        if (item) item.state = 'running';
        return response(config, { ok: true });
      }
      if (config.url === '/automation/broadcasts/scheduled-1/cancel') {
        const item = rows.find((row) => row.id === 'scheduled-1');
        if (item) item.state = 'cancelled';
        return response(config, { ok: true });
      }
      return response(config, {});
    };

    render(<BroadcastsWorkspace />);

    expect(await screen.findByText('Broadcast nháp')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Broadcast mới' }));
    await userEvent.type(screen.getByLabelText('Tên broadcast'), 'Broadcast mới');
    await userEvent.selectOptions(screen.getByLabelText('Block gửi tin'), 'block-1');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu broadcast' }));
    await userEvent.click(screen.getByRole('button', { name: 'Chạy Broadcast nháp' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tạm dừng Broadcast đang chạy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tiếp tục Broadcast tạm dừng' }));
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ Broadcast lên lịch' }));

    expect(calls).toContain('post /automation/broadcasts');
    expect(calls).toContain('post /automation/broadcasts/draft-1/start');
    expect(calls).toContain('post /automation/broadcasts/running-1/pause');
    expect(calls).toContain('post /automation/broadcasts/paused-1/resume');
    expect(calls).toContain('post /automation/broadcasts/scheduled-1/cancel');
  });
});
