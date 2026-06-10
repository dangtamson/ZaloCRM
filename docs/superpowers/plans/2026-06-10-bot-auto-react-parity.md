# Bot-Auto React Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild React Bot-Auto so `/automation/bot/*` supports the same major workflows as the existing Vue Bot-Auto implementation.

**Architecture:** Move automation-specific logic into `frontend-react/src/features/automation`, leaving route files as thin wrappers. Implement API/type parity first, then shared UI, then screen workflows in independent checkpoints with focused tests and commits.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, axios `apiClient`, React Router, Vitest, Testing Library, lucide-react.

---

## File Structure

- Create `frontend-react/src/features/automation/api.ts`: all Bot-Auto and customer-list API wrappers.
- Create `frontend-react/src/features/automation/types.ts`: full frontend types mirroring Vue/backend automation types.
- Create `frontend-react/src/features/automation/envelope.ts`: shared envelope unwrap helpers.
- Create `frontend-react/src/features/automation/hooks.ts`: small load/mutate hooks for feature screens.
- Create `frontend-react/src/features/automation/components/AutomationToolbar.tsx`: search, filters and primary action layout.
- Create `frontend-react/src/features/automation/components/StatusBadge.tsx`: status/action badges.
- Create `frontend-react/src/features/automation/components/ConfirmDialog.tsx`: reusable destructive confirmation.
- Create `frontend-react/src/features/automation/components/EditorDrawer.tsx`: shared drawer/panel shell.
- Create `frontend-react/src/features/automation/blocks/*`: block library and block editor components.
- Create `frontend-react/src/features/automation/sequences/*`: sequence list/editor and step editor.
- Create `frontend-react/src/features/automation/triggers/*`: trigger catalog/list/editor/manual run.
- Create `frontend-react/src/features/automation/broadcasts/*`: broadcast list/editor/lifecycle actions.
- Create `frontend-react/src/features/automation/lists/*`: list table, create modal and detail table.
- Modify `frontend-react/src/pages/automation/*.tsx`: replace scaffold tables with feature components.
- Modify `frontend-react/src/api/automation.ts`: either re-export feature API or remove imports after route migration.
- Modify `frontend-react/src/types/automation.ts`: either re-export feature types or remove imports after route migration.
- Extend `frontend-react/src/pages/automation/AutomationRoutes.test.tsx`: route-level workflows.
- Create test files next to feature modules: `*.test.ts` and `*.test.tsx`.

## Task 1: API And Type Parity

**Files:**
- Create: `frontend-react/src/features/automation/types.ts`
- Create: `frontend-react/src/features/automation/envelope.ts`
- Create: `frontend-react/src/features/automation/api.ts`
- Test: `frontend-react/src/features/automation/api.test.ts`
- Modify: `frontend-react/src/api/automation.ts`
- Modify: `frontend-react/src/types/automation.ts`

- [ ] **Step 1: Write failing API tests**

Add `frontend-react/src/features/automation/api.test.ts`:

```ts
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { describe, expect, it, beforeEach } from 'vitest';
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
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
cd frontend-react
npm test -- features/automation/api
```

Expected: fail because `frontend-react/src/features/automation/api.ts` does not exist.

- [ ] **Step 3: Implement feature types**

Create `frontend-react/src/features/automation/types.ts` with types copied and normalized from Vue:

```ts
export type BlockChannel = 'zalo_user';
export type BlockActionType =
  | 'request_friend'
  | 'send_message'
  | 'update_status'
  | 'send_image'
  | 'send_file'
  | 'send_template'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_user'
  | 'update_lead_score';

export const SUPPORTED_ACTION_TYPES: BlockActionType[] = ['request_friend', 'send_message', 'update_status'];

export interface AiImagePrompt {
  prompt: string;
  provider?: 'openai' | 'gemini' | 'custom';
  model?: string;
  size?: string;
  failOpen?: boolean;
}

export interface BlockFolder {
  id: string;
  orgId?: string;
  name: string;
  parentId?: string | null;
  ownerNickId?: string | null;
  ownerUserId?: string | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: { blocks: number };
}

export interface AutomationBlock {
  id: string;
  orgId?: string;
  folderId?: string | null;
  name: string;
  channel?: BlockChannel;
  actionType: BlockActionType;
  content?: Record<string, unknown>;
  ownerNickId?: string | null;
  isShared?: boolean;
  usageCount?: number;
  lastUsedAt?: string | null;
  archivedAt?: string | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  folder?: { id?: string; name?: string | null } | null;
  ownerNick?: { id: string; displayName: string | null } | null;
}

export interface SequenceStep {
  stepId: string;
  blockId: string;
  delayMinutes: number;
  exitCondition?: string;
}

export interface SequenceRuntimeRules {
  allowedHourRange?: [number, number];
  randomDelayPerSend?: { min: number; max: number };
  perNickThrottle?: boolean;
  crossNickRecencyDays?: number;
  stopOnAccept?: boolean;
}

export interface AutomationSequence {
  id: string;
  orgId?: string;
  name: string;
  description?: string | null;
  channel?: string;
  steps: SequenceStep[];
  runtimeRules?: SequenceRuntimeRules;
  enrolledCount?: number;
  completedCount?: number;
  failedCount?: number;
  enabled?: boolean;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  blocks?: Array<{ id: string; name: string; actionType: BlockActionType; archivedAt: string | null }>;
  _count?: { campaigns: number };
}

export type TriggerEventType =
  | 'friendship_accepted'
  | 'friendship_received'
  | 'first_message_received'
  | 'message_received'
  | 'keyword_match'
  | 'contact_created'
  | 'contact_status_changed'
  | 'contact_imported'
  | 'birthday'
  | 'scheduled_cron'
  | 'time_elapsed'
  | 'manual_run'
  | 'order_success';

export type TriggerCategory = 'general' | 'keyword' | 'bot_api' | 'livechat' | 'genai';
export type TriggerBindingKind = 'sequence' | 'block' | 'broadcast';

export interface TriggerCatalogEntry {
  eventType: TriggerEventType;
  category?: TriggerCategory;
  title: string;
  description?: string;
  recommendedBinding?: TriggerBindingKind;
  suggestedActionTypes?: BlockActionType[];
}

export interface AutomationTrigger {
  id: string;
  orgId?: string;
  name: string;
  category?: TriggerCategory;
  eventType: TriggerEventType;
  eventFilter?: Record<string, unknown> | null;
  bindingKind?: TriggerBindingKind;
  sequenceId?: string | null;
  blockId?: string | null;
  broadcastId?: string | null;
  segmentSpec?: Record<string, unknown> | null;
  ruleOverrides?: Record<string, unknown> | null;
  enabled?: boolean;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  sequence?: { id?: string; name?: string } | null;
  broadcast?: { id?: string; name?: string } | null;
  createdBy?: { id: string; fullName: string };
  _count?: { campaigns: number };
}

export type BroadcastState = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface BroadcastPacing {
  distributeAcrossNicks?: boolean;
  maxPerNickPerHour?: number;
  allowedHourRange?: [number, number];
  randomDelayBetweenSends?: { min: number; max: number };
}

export type SegmentSpec =
  | { kind: 'manual'; contactIds: string[] }
  | { kind: 'filter'; criteria: Record<string, unknown> }
  | { kind: 'customer-list'; listId: string; birthdayThisWeek?: boolean; birthdayToday?: boolean };

export interface AutomationBroadcast {
  id: string;
  orgId?: string;
  name: string;
  description?: string | null;
  channel?: string;
  blockId?: string;
  segmentSpec?: SegmentSpec;
  scheduleKind?: 'now' | 'scheduled' | 'recurring';
  scheduledAt?: string | null;
  recurringSpec?: Record<string, unknown> | null;
  pacing?: BroadcastPacing;
  state?: BroadcastState;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  block?: { id?: string; name?: string | null; actionType?: string; content?: Record<string, unknown>; archivedAt?: string | null } | null;
}

export type ListStatusFilter = 'active' | 'archived' | 'all';
export type EntryStatusTab = 'all' | 'valid' | 'invalid' | 'duplicate' | 'has_zalo' | 'no_zalo';

export interface CustomerListSummary {
  id: string;
  name: string;
  iconEmoji?: string | null;
  status?: 'processing' | 'done' | 'archived' | string;
  sourceType?: string | null;
  totalEntries?: number;
  validEntries?: number;
  invalidEntries?: number;
  duplicateEntries?: number;
  zaloResolvedEntries?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { id: string; fullName: string } | null;
}

export interface CustomerListEntry {
  id: string;
  displayName?: string | null;
  name?: string | null;
  nameRaw?: string | null;
  phone?: string | null;
  phoneRaw?: string | null;
  personalNote?: string | null;
  note?: string | null;
  status?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  occupation?: string | null;
  unit?: string | null;
  birthdayWish?: string | null;
  dupWithListName?: string | null;
}

export interface CustomerListEntryPatch {
  phoneRaw?: string;
  nameRaw?: string;
  personalNote?: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  unit?: string;
  birthdayWish?: string;
}
```

- [ ] **Step 4: Implement envelope helper**

Create `frontend-react/src/features/automation/envelope.ts`:

```ts
type Envelope<T> = T | Record<string, unknown>;

export function listFromEnvelope<T>(payload: Envelope<T[]>, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export function itemFromEnvelope<T>(payload: Envelope<T>, keys: string[]): T {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload as T;
  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return payload as T;
}
```

- [ ] **Step 5: Implement API wrappers**

Create `frontend-react/src/features/automation/api.ts` with wrapper functions for every endpoint in the spec. Use the existing `apiClient` import and exact endpoint paths from Vue:

```ts
import { apiClient } from '../../api/client';
import { itemFromEnvelope, listFromEnvelope } from './envelope';
import type {
  AutomationBlock,
  AutomationBroadcast,
  AutomationSequence,
  AutomationTrigger,
  BlockActionType,
  BlockFolder,
  BroadcastPacing,
  BroadcastState,
  CustomerListEntry,
  CustomerListEntryPatch,
  CustomerListSummary,
  EntryStatusTab,
  ListStatusFilter,
  SegmentSpec,
  SequenceRuntimeRules,
  SequenceStep,
  TriggerCatalogEntry,
  TriggerBindingKind,
  TriggerCategory,
  TriggerEventType,
} from './types';

export interface BlockCreateInput {
  name: string;
  channel?: string;
  actionType: BlockActionType;
  content: Record<string, unknown>;
  folderId?: string | null;
  ownerNickId?: string | null;
  isShared?: boolean;
}

export async function fetchAutomationBlocks(query: { includeArchived?: boolean; actionType?: BlockActionType; folderId?: string | null; limit?: number } = {}) {
  const { data } = await apiClient.get('/automation/blocks', { params: { ...query, folderId: query.folderId ?? undefined } });
  return listFromEnvelope<AutomationBlock>(data, ['blocks', 'data']);
}

export async function fetchAutomationBlock(id: string) {
  const { data } = await apiClient.get(`/automation/blocks/${id}`);
  return itemFromEnvelope<AutomationBlock>(data, ['block', 'data']);
}

export async function createBlock(input: BlockCreateInput) {
  const { data } = await apiClient.post('/automation/blocks', input);
  return data as AutomationBlock;
}

export async function updateBlock(id: string, patch: Partial<BlockCreateInput>) {
  const { data } = await apiClient.put(`/automation/blocks/${id}`, patch);
  return data as AutomationBlock;
}

export async function archiveBlock(id: string) {
  const { data } = await apiClient.post(`/automation/blocks/${id}/archive`);
  return data as AutomationBlock;
}

export async function unarchiveBlock(id: string) {
  const { data } = await apiClient.post(`/automation/blocks/${id}/unarchive`);
  return data as AutomationBlock;
}

export async function duplicateBlock(id: string) {
  const { data } = await apiClient.post(`/automation/blocks/${id}/duplicate`);
  return data as AutomationBlock;
}

export async function deleteBlock(id: string) {
  await apiClient.delete(`/automation/blocks/${id}`);
}

export async function fetchBlockFolders() {
  const { data } = await apiClient.get('/automation/block-folders');
  return listFromEnvelope<BlockFolder>(data, ['folders', 'data']);
}

export async function createBlockFolder(input: { name: string; parentId?: string | null; ownerNickId?: string | null; ownerUserId?: string | null }) {
  const { data } = await apiClient.post('/automation/block-folders', input);
  return data as BlockFolder;
}

export async function fetchTriggerCatalog() {
  const { data } = await apiClient.get('/automation/triggers/catalog');
  return listFromEnvelope<TriggerCatalogEntry>(data, ['catalog', 'data']);
}

export async function fetchAutomationTriggers(query: { eventType?: TriggerEventType; category?: TriggerCategory; enabled?: boolean } = {}) {
  const { data } = await apiClient.get('/automation/triggers', { params: query });
  return listFromEnvelope<AutomationTrigger>(data, ['triggers', 'data']);
}

export async function createTrigger(input: {
  name: string;
  category?: TriggerCategory;
  eventType: TriggerEventType;
  eventFilter?: Record<string, unknown> | null;
  bindingKind: TriggerBindingKind;
  sequenceId?: string | null;
  blockId?: string | null;
  broadcastId?: string | null;
  segmentSpec?: Record<string, unknown> | null;
  ruleOverrides?: Record<string, unknown> | null;
  enabled?: boolean;
}) {
  const { data } = await apiClient.post('/automation/triggers', input);
  return data as AutomationTrigger;
}

export async function updateTrigger(id: string, patch: Partial<Parameters<typeof createTrigger>[0]>) {
  const { data } = await apiClient.put(`/automation/triggers/${id}`, patch);
  return data as AutomationTrigger;
}

export async function enableTrigger(id: string) {
  const { data } = await apiClient.post(`/automation/triggers/${id}/enable`);
  return data as AutomationTrigger;
}

export async function disableTrigger(id: string) {
  const { data } = await apiClient.post(`/automation/triggers/${id}/disable`);
  return data as AutomationTrigger;
}

export async function runTrigger(id: string, input: { contactId?: string; segmentHint?: Record<string, unknown>; payload?: Record<string, unknown> } = {}) {
  const { data } = await apiClient.post(`/automation/triggers/${id}/run`, input);
  return data as { accepted: boolean; triggerId: string; eventType: string; mode?: string; outcome?: string; errorMessage?: string };
}

export async function deleteTrigger(id: string) {
  await apiClient.delete(`/automation/triggers/${id}`);
}

export async function fetchAutomationSequences(query: { enabled?: boolean; channel?: string } = {}) {
  const { data } = await apiClient.get('/automation/sequences', { params: query });
  return listFromEnvelope<AutomationSequence>(data, ['sequences', 'data']);
}

export async function createSequence(input: { name: string; description?: string; channel?: string; steps: SequenceStep[]; runtimeRules?: SequenceRuntimeRules; enabled?: boolean }) {
  const { data } = await apiClient.post('/automation/sequences', input);
  return data as AutomationSequence;
}

export async function updateSequence(id: string, patch: Partial<Parameters<typeof createSequence>[0]>) {
  const { data } = await apiClient.put(`/automation/sequences/${id}`, patch);
  return data as AutomationSequence;
}

export async function enableSequence(id: string) {
  const { data } = await apiClient.post(`/automation/sequences/${id}/enable`);
  return data as AutomationSequence;
}

export async function disableSequence(id: string) {
  const { data } = await apiClient.post(`/automation/sequences/${id}/disable`);
  return data as AutomationSequence;
}

export async function duplicateSequence(id: string) {
  const { data } = await apiClient.post(`/automation/sequences/${id}/duplicate`);
  return data as AutomationSequence;
}

export async function deleteSequence(id: string) {
  await apiClient.delete(`/automation/sequences/${id}`);
}

export async function fetchAutomationBroadcasts(query: { state?: BroadcastState; channel?: string } = {}) {
  const { data } = await apiClient.get('/automation/broadcasts', { params: query });
  return listFromEnvelope<AutomationBroadcast>(data, ['broadcasts', 'data']);
}

export async function createBroadcast(input: { name: string; description?: string; channel?: string; blockId: string; segmentSpec: SegmentSpec; scheduleKind?: 'now' | 'scheduled' | 'recurring'; scheduledAt?: string; pacing?: BroadcastPacing }) {
  const { data } = await apiClient.post('/automation/broadcasts', input);
  return data as AutomationBroadcast;
}

export async function updateBroadcast(id: string, patch: Partial<Parameters<typeof createBroadcast>[0]>) {
  const { data } = await apiClient.put(`/automation/broadcasts/${id}`, patch);
  return data as AutomationBroadcast;
}

export async function previewBroadcast(id: string) {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/preview`);
  return data as { totalResolved: number; friendableRecipients: number; nonFriendableSkipped: number };
}

export async function startBroadcast(id: string) {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/start`);
  return data as { ok: boolean; recipientsEnqueued: number; note?: string };
}

export async function pauseBroadcast(id: string) {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/pause`);
  return data as { ok: boolean };
}

export async function resumeBroadcast(id: string) {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/resume`);
  return data as { ok: boolean };
}

export async function cancelBroadcast(id: string) {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/cancel`);
  return data as { ok: boolean };
}

export async function deleteBroadcast(id: string) {
  await apiClient.delete(`/automation/broadcasts/${id}`);
}

export async function fetchCustomerLists(query: { status?: ListStatusFilter; page?: number; limit?: number; search?: string } = {}) {
  const { data } = await apiClient.get('/customer-lists', { params: { status: query.status ?? 'active', page: query.page ?? 1, limit: query.limit ?? 20, search: query.search || undefined } });
  return { lists: listFromEnvelope<CustomerListSummary>(data, ['lists', 'data']), total: (data as { total?: number }).total ?? 0 };
}

export async function fetchCustomerList(id: string) {
  const { data } = await apiClient.get(`/customer-lists/${id}`);
  return itemFromEnvelope<CustomerListSummary>(data, ['list', 'data']);
}

export async function dryRunCustomerList(input: { rawText?: string; rows?: Array<Record<string, unknown>> }) {
  const { data } = await apiClient.post('/customer-lists/dry-run', input);
  return data as { total: number; valid: number; invalid: number; duplicates?: number };
}

export async function createCustomerList(input: { name?: string; iconEmoji?: string | null; sourceType?: string; rawText?: string; rows?: Array<Record<string, unknown>> }) {
  const { data } = await apiClient.post('/customer-lists', input);
  return data as CustomerListSummary;
}

export async function renameCustomerList(id: string, name: string) {
  const { data } = await apiClient.patch(`/customer-lists/${id}`, { name });
  return data as CustomerListSummary;
}

export async function archiveCustomerList(id: string) {
  const { data } = await apiClient.post(`/customer-lists/${id}/archive`);
  return data;
}

export async function unarchiveCustomerList(id: string) {
  const { data } = await apiClient.post(`/customer-lists/${id}/unarchive`);
  return data;
}

export async function rescanCustomerList(id: string) {
  const { data } = await apiClient.post(`/customer-lists/${id}/rescan-zalo`);
  return data;
}

export async function deleteCustomerList(id: string) {
  await apiClient.delete(`/customer-lists/${id}`);
}

export async function fetchCustomerListEntries(id: string, query: { tab?: EntryStatusTab; page?: number; limit?: number; search?: string } = {}) {
  const { data } = await apiClient.get(`/customer-lists/${id}/entries`, { params: { tab: query.tab ?? 'all', page: query.page ?? 1, limit: query.limit ?? 50, search: query.search || undefined } });
  return { entries: listFromEnvelope<CustomerListEntry>(data, ['entries', 'data']), total: (data as { total?: number }).total ?? 0 };
}

export async function updateListEntry(listId: string, entryId: string, patch: CustomerListEntryPatch) {
  const { data } = await apiClient.patch(`/customer-lists/${listId}/entries/${entryId}`, patch);
  return data as { entry: CustomerListEntry; conflictWarn?: boolean; dupWithListName?: string | null };
}

export async function addListEntries(listId: string, rawText: string) {
  const { data } = await apiClient.post(`/customer-lists/${listId}/entries`, { rawText });
  return data as { ok: true; added: number; valid: number; invalid: number };
}

export async function deleteListEntry(listId: string, entryId: string) {
  await apiClient.delete(`/customer-lists/${listId}/entries/${entryId}`);
}

export async function bulkResolveListEntries(listId: string, entryIds: string[], action: 'skip' | 'overwrite' | 'keep_both' | 'delete') {
  const { data } = await apiClient.post(`/customer-lists/${listId}/entries/bulk`, { entryIds, action });
  return data as { ok: boolean; affected?: number };
}
```

- [ ] **Step 6: Re-export old paths**

Replace `frontend-react/src/api/automation.ts` with:

```ts
export * from '../features/automation/api';
```

Replace `frontend-react/src/types/automation.ts` with:

```ts
export * from '../features/automation/types';
```

- [ ] **Step 7: Run tests and build**

Run:

```bash
cd frontend-react
npm test -- features/automation/api automation
npm run build
```

Expected: API tests pass, existing automation route tests pass, build passes.

- [ ] **Step 8: Commit**

```bash
git add frontend-react/src/features/automation frontend-react/src/api/automation.ts frontend-react/src/types/automation.ts
git commit -m "feat: add react bot auto api parity"
```

## Task 2: Shared Automation UI Shell

**Files:**
- Create: `frontend-react/src/features/automation/components/AutomationToolbar.tsx`
- Create: `frontend-react/src/features/automation/components/StatusBadge.tsx`
- Create: `frontend-react/src/features/automation/components/EditorDrawer.tsx`
- Create: `frontend-react/src/features/automation/components/ConfirmDialog.tsx`
- Modify: `frontend-react/src/components/automation/AutomationTable.tsx`
- Modify: `frontend-react/src/pages/automation/BotAutoShell.tsx`
- Test: `frontend-react/src/features/automation/components/AutomationUi.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `frontend-react/src/features/automation/components/AutomationUi.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AutomationToolbar from './AutomationToolbar';
import ConfirmDialog from './ConfirmDialog';
import EditorDrawer from './EditorDrawer';
import StatusBadge from './StatusBadge';

describe('automation shared ui', () => {
  it('renders search, filters and create action in the toolbar', async () => {
    const onSearch = vi.fn();
    const onCreate = vi.fn();
    render(
      <AutomationToolbar
        createLabel="Tạo block"
        filters={<button type="button">Archived</button>}
        onCreate={onCreate}
        onSearchChange={onSearch}
        searchPlaceholder="Tìm block"
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('Tìm block'), 'hello');
    await userEvent.click(screen.getByRole('button', { name: 'Tạo block' }));

    expect(onSearch).toHaveBeenLastCalledWith('hello');
    expect(onCreate).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Archived' })).toBeInTheDocument();
  });

  it('renders status badges and drawer content', () => {
    render(
      <>
        <StatusBadge tone="success">Đang bật</StatusBadge>
        <EditorDrawer open title="Sửa trigger" onClose={() => undefined}>
          <button type="button">Lưu</button>
        </EditorDrawer>
      </>,
    );

    expect(screen.getByText('Đang bật')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sửa trigger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument();
  });

  it('confirms destructive actions', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog description="Xóa dữ liệu này?" onCancel={() => undefined} onConfirm={onConfirm} open title="Xác nhận xóa" />);

    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    expect(onConfirm).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
cd frontend-react
npm test -- AutomationUi
```

Expected: fail because shared UI components do not exist.

- [ ] **Step 3: Implement `StatusBadge`**

Create `frontend-react/src/features/automation/components/StatusBadge.tsx`:

```tsx
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-blue-50 text-blue-700',
};

export default function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={twMerge('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', tones[tone])}>{children}</span>;
}
```

- [ ] **Step 4: Implement toolbar**

Create `frontend-react/src/features/automation/components/AutomationToolbar.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Plus, Search } from 'lucide-react';

interface AutomationToolbarProps {
  searchPlaceholder: string;
  createLabel: string;
  filters?: ReactNode;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}

export default function AutomationToolbar({ searchPlaceholder, createLabel, filters, onSearchChange, onCreate }: AutomationToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500" onClick={onCreate} type="button">
          <Plus size={16} />
          {createLabel}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement drawer and confirm dialog**

Create `frontend-react/src/features/automation/components/EditorDrawer.tsx` and `ConfirmDialog.tsx` using fixed overlays, `role="dialog"`, close buttons and Tailwind classes. `EditorDrawer` must render nothing when `open` is false. `ConfirmDialog` must render buttons named `Hủy` and `Xác nhận`.

- [ ] **Step 6: Improve table action support**

Modify `frontend-react/src/components/automation/AutomationTable.tsx` to accept optional `actions?: (row: T) => ReactNode`, render an `Actions` column when present, and keep existing table tests passing.

- [ ] **Step 7: Run tests and build**

Run:

```bash
cd frontend-react
npm test -- AutomationUi automation
npm run build
```

Expected: UI tests, automation tests and build pass.

- [ ] **Step 8: Commit**

```bash
git add frontend-react/src/features/automation/components frontend-react/src/components/automation/AutomationTable.tsx frontend-react/src/pages/automation/BotAutoShell.tsx
git commit -m "feat: add react bot auto shared ui"
```

## Task 3: Blocks Parity

**Files:**
- Create: `frontend-react/src/features/automation/blocks/BlocksWorkspace.tsx`
- Create: `frontend-react/src/features/automation/blocks/BlockEditorDrawer.tsx`
- Modify: `frontend-react/src/pages/automation/BlocksPage.tsx`
- Test: `frontend-react/src/features/automation/blocks/BlocksWorkspace.test.tsx`

- [ ] **Step 1: Write failing blocks workflow test**

Create `frontend-react/src/features/automation/blocks/BlocksWorkspace.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
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
    await userEvent.type(screen.getByLabelText('Nội dung tin nhắn'), 'Xin chào {{name}}');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu block' }));

    expect(payloads[0]).toMatchObject({ name: 'Block mới', actionType: 'send_message', content: { textVariants: ['Xin chào {{name}}'] } });
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
cd frontend-react
npm test -- BlocksWorkspace
```

Expected: fail because `BlocksWorkspace` does not exist.

- [ ] **Step 3: Implement blocks workspace**

Create `BlocksWorkspace.tsx` that loads `fetchAutomationBlocks({ includeArchived: true, limit: 500 })` and `fetchBlockFolders()`, shows folder filters, action type filter, archived toggle, row actions for edit/duplicate/archive/unarchive, and opens `BlockEditorDrawer`.

- [ ] **Step 4: Implement minimal block editor**

Create `BlockEditorDrawer.tsx` supporting:

- Required `name`.
- `actionType` select for `request_friend`, `send_message`, `update_status`.
- `send_message` text variants as newline or single textarea mapped to `content.textVariants`.
- `request_friend` greeting variants mapped to `content.greetingVariants`.
- `update_status` status id input mapped to `content.statusId`.
- Save via `createBlock` or `updateBlock`.

- [ ] **Step 5: Replace page wrapper**

Modify `frontend-react/src/pages/automation/BlocksPage.tsx`:

```tsx
import BlocksWorkspace from '../../features/automation/blocks/BlocksWorkspace';

export default function BlocksPage() {
  return <BlocksWorkspace />;
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
cd frontend-react
npm test -- BlocksWorkspace automation
npm run build
```

Expected: tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add frontend-react/src/features/automation/blocks frontend-react/src/pages/automation/BlocksPage.tsx
git commit -m "feat: add react bot auto blocks workspace"
```

## Task 4: Sequences Parity

**Files:**
- Create: `frontend-react/src/features/automation/sequences/SequencesWorkspace.tsx`
- Create: `frontend-react/src/features/automation/sequences/SequenceStepEditor.tsx`
- Modify: `frontend-react/src/pages/automation/SequencesPage.tsx`
- Test: `frontend-react/src/features/automation/sequences/SequencesWorkspace.test.tsx`

- [ ] **Step 1: Write failing sequence workflow test**

Create a test that loads sequences and blocks, creates a new sequence with one block step, and asserts `POST /automation/sequences` receives `{ name, steps, runtimeRules }`.

- [ ] **Step 2: Run test and verify it fails**

Run `npm test -- SequencesWorkspace`. Expected: missing component failure.

- [ ] **Step 3: Implement sequence workspace**

Implement searchable list, editor panel, save, enable/disable, duplicate and delete actions using feature API.

- [ ] **Step 4: Implement step editor**

Implement add/remove/reorder block steps, block picker, delay minutes input, and archived block warning.

- [ ] **Step 5: Replace page wrapper**

Modify `SequencesPage.tsx` to render `SequencesWorkspace`.

- [ ] **Step 6: Verify and commit**

Run `npm test -- SequencesWorkspace automation && npm run build`, then commit:

```bash
git add frontend-react/src/features/automation/sequences frontend-react/src/pages/automation/SequencesPage.tsx
git commit -m "feat: add react bot auto sequences workspace"
```

## Task 5: Triggers Parity

**Files:**
- Create: `frontend-react/src/features/automation/triggers/TriggersWorkspace.tsx`
- Create: `frontend-react/src/features/automation/triggers/TriggerEditorDrawer.tsx`
- Modify: `frontend-react/src/pages/automation/TriggersPage.tsx`
- Test: `frontend-react/src/features/automation/triggers/TriggersWorkspace.test.tsx`

- [ ] **Step 1: Write failing trigger workflow test**

Create a test that loads catalog, configured triggers, sequences, blocks and lists; creates a trigger from catalog; toggles enabled; runs manual trigger. Assert endpoint calls:

- `GET /automation/triggers/catalog`
- `POST /automation/triggers`
- `POST /automation/triggers/:id/disable`
- `POST /automation/triggers/:id/run`

- [ ] **Step 2: Run test and verify it fails**

Run `npm test -- TriggersWorkspace`. Expected: missing component failure.

- [ ] **Step 3: Implement triggers workspace**

Implement configured/catalog tabs, search/category filters, configured trigger table, enable/disable, run and delete.

- [ ] **Step 4: Implement trigger editor**

Support event type, binding kind, sequence/block/broadcast id, enabled flag, customer-list segment, birthday flags and simple JSON fields for event filter/rule overrides.

- [ ] **Step 5: Replace page wrapper**

Modify `TriggersPage.tsx` to render `TriggersWorkspace`.

- [ ] **Step 6: Verify and commit**

Run `npm test -- TriggersWorkspace automation && npm run build`, then commit:

```bash
git add frontend-react/src/features/automation/triggers frontend-react/src/pages/automation/TriggersPage.tsx
git commit -m "feat: add react bot auto triggers workspace"
```

## Task 6: Broadcasts Parity

**Files:**
- Create: `frontend-react/src/features/automation/broadcasts/BroadcastsWorkspace.tsx`
- Create: `frontend-react/src/features/automation/broadcasts/BroadcastEditorDrawer.tsx`
- Modify: `frontend-react/src/pages/automation/BroadcastsPage.tsx`
- Test: `frontend-react/src/features/automation/broadcasts/BroadcastsWorkspace.test.tsx`

- [ ] **Step 1: Write failing broadcast workflow test**

Create a test that loads broadcasts and send-message blocks, creates a draft broadcast with customer-list segment, previews it, and starts it.

- [ ] **Step 2: Run test and verify it fails**

Run `npm test -- BroadcastsWorkspace`. Expected: missing component failure.

- [ ] **Step 3: Implement broadcast workspace**

Implement state filters/counts, table, lifecycle action buttons for preview/start/pause/resume/cancel/delete and status updates after mutations.

- [ ] **Step 4: Implement broadcast editor**

Support name, description, block selection, segment kind, manual contact IDs, customer list id, birthday flags, schedule kind/scheduledAt and pacing fields.

- [ ] **Step 5: Replace page wrapper**

Modify `BroadcastsPage.tsx` to render `BroadcastsWorkspace`.

- [ ] **Step 6: Verify and commit**

Run `npm test -- BroadcastsWorkspace automation && npm run build`, then commit:

```bash
git add frontend-react/src/features/automation/broadcasts frontend-react/src/pages/automation/BroadcastsPage.tsx
git commit -m "feat: add react bot auto broadcasts workspace"
```

## Task 7: Lists And List Detail Parity

**Files:**
- Create: `frontend-react/src/features/automation/lists/ListsWorkspace.tsx`
- Create: `frontend-react/src/features/automation/lists/CreateListModal.tsx`
- Create: `frontend-react/src/features/automation/lists/ListDetailWorkspace.tsx`
- Modify: `frontend-react/src/pages/automation/ListsPage.tsx`
- Modify: `frontend-react/src/pages/automation/ListDetailPage.tsx`
- Test: `frontend-react/src/features/automation/lists/ListsWorkspace.test.tsx`
- Test: `frontend-react/src/features/automation/lists/ListDetailWorkspace.test.tsx`

- [ ] **Step 1: Write failing lists workflow test**

Create a test that loads list filters, creates a pasted list, archives a list, rescans a list, and navigates-ready link remains present.

- [ ] **Step 2: Write failing list detail workflow test**

Create a test that loads a list and entries, edits an entry name, adds pasted rows, selects one row and bulk resolves it.

- [ ] **Step 3: Run tests and verify they fail**

Run `npm test -- ListsWorkspace ListDetailWorkspace`. Expected: missing component failures.

- [ ] **Step 4: Implement lists workspace**

Implement active/archived/all status tabs, search, create modal, archive/unarchive/rescan/delete actions, counters and source labels.

- [ ] **Step 5: Implement create list modal**

Support paste input and CSV file import. Use browser `FileReader` and parse CSV rows with a small local parser that handles comma-separated rows and quoted cells. Do not add `xlsx` or `exceljs` in this task; `frontend-react/package.json` does not currently include either dependency. If Excel import must exactly match Vue in this checkpoint, first add a separate failing test and dependency-change commit for `xlsx` parsing before continuing this task.

- [ ] **Step 6: Implement list detail workspace**

Implement tabs, search, pagination, inline edit fields, add rows, delete row with undo timer, bulk actions and visible column preferences in localStorage.

- [ ] **Step 7: Replace page wrappers**

Modify `ListsPage.tsx` and `ListDetailPage.tsx` to render the feature workspaces.

- [ ] **Step 8: Verify and commit**

Run `npm test -- ListsWorkspace ListDetailWorkspace automation && npm run build`, then commit:

```bash
git add frontend-react/src/features/automation/lists frontend-react/src/pages/automation/ListsPage.tsx frontend-react/src/pages/automation/ListDetailPage.tsx
git commit -m "feat: add react bot auto customer lists"
```

## Task 8: Final Verification And Plan Update

**Files:**
- Modify: `docs/superpowers/plans/2026-06-10-frontend-react-parallel-migration.md`
- Modify: `docs/superpowers/plans/2026-06-10-bot-auto-react-parity.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
cd frontend-react
npm test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 2: Runtime smoke check**

With backend on `3000` and Vite React on `5174`, run:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5174/automation/bot/triggers
```

Expected: `200`.

- [ ] **Step 3: Update migration plan**

Mark Bot-Auto parity subtasks as complete. If Excel import is not implemented because `xlsx` parsing was not added to `frontend-react`, add this exact note to the migration plan: `Bot-Auto React supports paste and CSV customer-list import; Excel import remains on Vue until React adds an xlsx parser dependency.`

- [ ] **Step 4: Commit verification docs**

```bash
git add docs/superpowers/plans/2026-06-10-frontend-react-parallel-migration.md docs/superpowers/plans/2026-06-10-bot-auto-react-parity.md
git commit -m "docs: update react bot auto parity progress"
```

## Self-Review Notes

- Spec coverage: API parity is Task 1, shared UI Task 2, Blocks Task 3, Sequences Task 4, Triggers Task 5, Broadcasts Task 6, Lists and List Detail Task 7, verification Task 8.
- Scope risk: Vue List Detail and Block Editor are the largest surfaces. The plan keeps them feature-local and test-driven to avoid a single monolithic React file.
- Excel parsing risk: Vue uses `exceljs`/`xlsx`, while React does not currently include those dependencies. Task 7 implements paste and CSV import without silently adding a new parser dependency.
