import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../api/client';
import {
  archiveBlock,
  bulkResolveListEntries,
  createBlock,
  createCustomerList,
  fetchBlockFolders,
  fetchTriggerCatalog,
  previewBroadcast,
  runTrigger,
  updateListEntry,
} from './api';

function response(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config: config as AxiosResponse['config'] };
}

describe('automation feature api', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = undefined;
  });

  it('unwraps list response keys used by the backend', async () => {
    const seen: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      seen.push(config.url ?? '');
      if (config.url === '/automation/triggers/catalog') return response(config, { catalog: [{ eventType: 'birthday', title: 'Sinh nhật' }] });
      if (config.url === '/automation/block-folders') return response(config, { folders: [{ id: 'f1', name: 'Shared' }] });
      return response(config, {});
    };

    await expect(fetchTriggerCatalog()).resolves.toEqual([{ eventType: 'birthday', title: 'Sinh nhật' }]);
    await expect(fetchBlockFolders()).resolves.toEqual([{ id: 'f1', name: 'Shared' }]);
    expect(seen).toEqual(['/automation/triggers/catalog', '/automation/block-folders']);
  });

  it('calls mutation endpoints with the backend payload shape', async () => {
    const calls: Array<{ url?: string; method?: string; data?: unknown }> = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push({ url: config.url, method: config.method, data: config.data ? JSON.parse(String(config.data)) : undefined });
      if (config.url === '/automation/blocks') return response(config, { id: 'b1', name: 'Block' });
      if (config.url === '/automation/blocks/b1/archive') return response(config, { id: 'b1', archivedAt: '2026-06-10T00:00:00.000Z' });
      if (config.url === '/automation/triggers/t1/run') return response(config, { accepted: true, triggerId: 't1', eventType: 'manual_run' });
      if (config.url === '/automation/broadcasts/bc1/preview') return response(config, { totalResolved: 3, friendableRecipients: 2, nonFriendableSkipped: 1 });
      if (config.url === '/customer-lists') return response(config, { id: 'l1', totalEntries: 2 });
      if (config.url === '/customer-lists/l1/entries/e1') return response(config, { entry: { id: 'e1', nameRaw: 'A' } });
      if (config.url === '/customer-lists/l1/entries/bulk') return response(config, { ok: true, affected: 1 });
      return response(config, {});
    };

    await createBlock({ name: 'Block', actionType: 'send_message', content: { textVariants: ['Hi'] } });
    await archiveBlock('b1');
    await runTrigger('t1', { contactId: 'c1' });
    await previewBroadcast('bc1');
    await createCustomerList({ name: 'List', rawText: '0901' });
    await updateListEntry('l1', 'e1', { nameRaw: 'A' });
    await bulkResolveListEntries('l1', ['e1'], 'skip');

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      'post /automation/blocks',
      'post /automation/blocks/b1/archive',
      'post /automation/triggers/t1/run',
      'post /automation/broadcasts/bc1/preview',
      'post /customer-lists',
      'patch /customer-lists/l1/entries/e1',
      'post /customer-lists/l1/entries/bulk',
    ]);
  });
});
