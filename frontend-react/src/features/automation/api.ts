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
  TriggerBindingKind,
  TriggerCatalogEntry,
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

export async function fetchAutomationBlocks(
  query: { includeArchived?: boolean; actionType?: BlockActionType; folderId?: string | null; limit?: number } = {},
): Promise<AutomationBlock[]> {
  const { data } = await apiClient.get('/automation/blocks', { params: { ...query, folderId: query.folderId ?? undefined } });
  return listFromEnvelope<AutomationBlock>(data, ['blocks', 'data']);
}

export async function fetchAutomationBlock(id: string): Promise<AutomationBlock> {
  const { data } = await apiClient.get(`/automation/blocks/${id}`);
  return itemFromEnvelope<AutomationBlock>(data, ['block', 'data']);
}

export async function createBlock(input: BlockCreateInput): Promise<AutomationBlock> {
  const { data } = await apiClient.post('/automation/blocks', input);
  return data as AutomationBlock;
}

export async function updateBlock(id: string, patch: Partial<BlockCreateInput>): Promise<AutomationBlock> {
  const { data } = await apiClient.put(`/automation/blocks/${id}`, patch);
  return data as AutomationBlock;
}

export async function archiveBlock(id: string): Promise<AutomationBlock> {
  const { data } = await apiClient.post(`/automation/blocks/${id}/archive`);
  return data as AutomationBlock;
}

export async function unarchiveBlock(id: string): Promise<AutomationBlock> {
  const { data } = await apiClient.post(`/automation/blocks/${id}/unarchive`);
  return data as AutomationBlock;
}

export async function duplicateBlock(id: string): Promise<AutomationBlock> {
  const { data } = await apiClient.post(`/automation/blocks/${id}/duplicate`);
  return data as AutomationBlock;
}

export async function deleteBlock(id: string): Promise<void> {
  await apiClient.delete(`/automation/blocks/${id}`);
}

export async function fetchBlockFolders(): Promise<BlockFolder[]> {
  const { data } = await apiClient.get('/automation/block-folders');
  return listFromEnvelope<BlockFolder>(data, ['folders', 'data']);
}

export async function createBlockFolder(input: { name: string; parentId?: string | null; ownerNickId?: string | null; ownerUserId?: string | null }): Promise<BlockFolder> {
  const { data } = await apiClient.post('/automation/block-folders', input);
  return data as BlockFolder;
}

export async function updateBlockFolder(
  id: string,
  patch: Partial<{ name: string; parentId?: string | null; ownerNickId?: string | null; ownerUserId?: string | null }>,
): Promise<BlockFolder> {
  const { data } = await apiClient.put(`/automation/block-folders/${id}`, patch);
  return data as BlockFolder;
}

export async function deleteBlockFolder(id: string, force = false): Promise<void> {
  await apiClient.delete(`/automation/block-folders/${id}`, { params: force ? { force: 'true' } : {} });
}

export async function fetchTriggerCatalog(): Promise<TriggerCatalogEntry[]> {
  const { data } = await apiClient.get('/automation/triggers/catalog');
  return listFromEnvelope<TriggerCatalogEntry>(data, ['catalog', 'data']);
}

export async function fetchAutomationTriggers(query: { eventType?: TriggerEventType; category?: TriggerCategory; enabled?: boolean } = {}): Promise<AutomationTrigger[]> {
  const { data } = await apiClient.get('/automation/triggers', { params: query });
  return listFromEnvelope<AutomationTrigger>(data, ['triggers', 'data']);
}

export interface TriggerCreateInput {
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
}

export async function createTrigger(input: TriggerCreateInput): Promise<AutomationTrigger> {
  const { data } = await apiClient.post('/automation/triggers', input);
  return data as AutomationTrigger;
}

export async function updateTrigger(id: string, patch: Partial<TriggerCreateInput>): Promise<AutomationTrigger> {
  const { data } = await apiClient.put(`/automation/triggers/${id}`, patch);
  return data as AutomationTrigger;
}

export async function enableTrigger(id: string): Promise<AutomationTrigger> {
  const { data } = await apiClient.post(`/automation/triggers/${id}/enable`);
  return data as AutomationTrigger;
}

export async function disableTrigger(id: string): Promise<AutomationTrigger> {
  const { data } = await apiClient.post(`/automation/triggers/${id}/disable`);
  return data as AutomationTrigger;
}

export async function runTrigger(
  id: string,
  input: { contactId?: string; segmentHint?: Record<string, unknown>; payload?: Record<string, unknown> } = {},
): Promise<{ accepted: boolean; triggerId: string; eventType: string; mode?: string; outcome?: string; errorMessage?: string }> {
  const { data } = await apiClient.post(`/automation/triggers/${id}/run`, input);
  return data as { accepted: boolean; triggerId: string; eventType: string; mode?: string; outcome?: string; errorMessage?: string };
}

export async function deleteTrigger(id: string): Promise<void> {
  await apiClient.delete(`/automation/triggers/${id}`);
}

export async function fetchAutomationSequences(query: { enabled?: boolean; channel?: string } = {}): Promise<AutomationSequence[]> {
  const { data } = await apiClient.get('/automation/sequences', { params: query });
  return listFromEnvelope<AutomationSequence>(data, ['sequences', 'data']);
}

export interface SequenceCreateInput {
  name: string;
  description?: string;
  channel?: string;
  steps: SequenceStep[];
  runtimeRules?: SequenceRuntimeRules;
  enabled?: boolean;
}

export async function createSequence(input: SequenceCreateInput): Promise<AutomationSequence> {
  const { data } = await apiClient.post('/automation/sequences', input);
  return data as AutomationSequence;
}

export async function updateSequence(id: string, patch: Partial<SequenceCreateInput>): Promise<AutomationSequence> {
  const { data } = await apiClient.put(`/automation/sequences/${id}`, patch);
  return data as AutomationSequence;
}

export async function enableSequence(id: string): Promise<AutomationSequence> {
  const { data } = await apiClient.post(`/automation/sequences/${id}/enable`);
  return data as AutomationSequence;
}

export async function disableSequence(id: string): Promise<AutomationSequence> {
  const { data } = await apiClient.post(`/automation/sequences/${id}/disable`);
  return data as AutomationSequence;
}

export async function duplicateSequence(id: string): Promise<AutomationSequence> {
  const { data } = await apiClient.post(`/automation/sequences/${id}/duplicate`);
  return data as AutomationSequence;
}

export async function deleteSequence(id: string): Promise<void> {
  await apiClient.delete(`/automation/sequences/${id}`);
}

export async function fetchAutomationBroadcasts(query: { state?: BroadcastState; channel?: string } = {}): Promise<AutomationBroadcast[]> {
  const { data } = await apiClient.get('/automation/broadcasts', { params: query });
  return listFromEnvelope<AutomationBroadcast>(data, ['broadcasts', 'data']);
}

export interface BroadcastCreateInput {
  name: string;
  description?: string;
  channel?: string;
  blockId: string;
  segmentSpec: SegmentSpec;
  scheduleKind?: 'now' | 'scheduled' | 'recurring';
  scheduledAt?: string;
  pacing?: BroadcastPacing;
}

export async function createBroadcast(input: BroadcastCreateInput): Promise<AutomationBroadcast> {
  const { data } = await apiClient.post('/automation/broadcasts', input);
  return data as AutomationBroadcast;
}

export async function updateBroadcast(id: string, patch: Partial<BroadcastCreateInput>): Promise<AutomationBroadcast> {
  const { data } = await apiClient.put(`/automation/broadcasts/${id}`, patch);
  return data as AutomationBroadcast;
}

export async function previewBroadcast(id: string): Promise<{ totalResolved: number; friendableRecipients: number; nonFriendableSkipped: number }> {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/preview`);
  return data as { totalResolved: number; friendableRecipients: number; nonFriendableSkipped: number };
}

export async function startBroadcast(id: string): Promise<{ ok: boolean; recipientsEnqueued: number; note?: string }> {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/start`);
  return data as { ok: boolean; recipientsEnqueued: number; note?: string };
}

export async function pauseBroadcast(id: string): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/pause`);
  return data as { ok: boolean };
}

export async function resumeBroadcast(id: string): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/resume`);
  return data as { ok: boolean };
}

export async function cancelBroadcast(id: string): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post(`/automation/broadcasts/${id}/cancel`);
  return data as { ok: boolean };
}

export async function deleteBroadcast(id: string): Promise<void> {
  await apiClient.delete(`/automation/broadcasts/${id}`);
}

export async function fetchCustomerListsPage(
  query: { status?: ListStatusFilter; page?: number; limit?: number; search?: string } = {},
): Promise<{ lists: CustomerListSummary[]; total: number }> {
  const { data } = await apiClient.get('/customer-lists', {
    params: { status: query.status ?? 'active', page: query.page ?? 1, limit: query.limit ?? 20, search: query.search || undefined },
  });
  return { lists: listFromEnvelope<CustomerListSummary>(data, ['lists', 'data']), total: (data as { total?: number }).total ?? 0 };
}

export async function fetchCustomerLists(query: { status?: ListStatusFilter; page?: number; limit?: number; search?: string } = {}): Promise<CustomerListSummary[]> {
  const { lists } = await fetchCustomerListsPage(query);
  return lists;
}

export async function fetchCustomerList(id: string): Promise<CustomerListSummary> {
  const { data } = await apiClient.get(`/customer-lists/${id}`);
  return itemFromEnvelope<CustomerListSummary>(data, ['list', 'data']);
}

export async function dryRunCustomerList(input: { rawText?: string; rows?: Array<Record<string, unknown>> }): Promise<{ total: number; valid: number; invalid: number; duplicates?: number }> {
  const { data } = await apiClient.post('/customer-lists/dry-run', input);
  return data as { total: number; valid: number; invalid: number; duplicates?: number };
}

export async function createCustomerList(input: { name?: string; iconEmoji?: string | null; sourceType?: string; rawText?: string; rows?: Array<Record<string, unknown>> }): Promise<CustomerListSummary> {
  const { data } = await apiClient.post('/customer-lists', input);
  return data as CustomerListSummary;
}

export async function renameCustomerList(id: string, name: string): Promise<CustomerListSummary> {
  const { data } = await apiClient.patch(`/customer-lists/${id}`, { name });
  return data as CustomerListSummary;
}

export async function archiveCustomerList(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/customer-lists/${id}/archive`);
  return data;
}

export async function unarchiveCustomerList(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/customer-lists/${id}/unarchive`);
  return data;
}

export async function rescanCustomerList(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/customer-lists/${id}/rescan-zalo`);
  return data;
}

export async function deleteCustomerList(id: string): Promise<void> {
  await apiClient.delete(`/customer-lists/${id}`);
}

export async function fetchCustomerListEntriesPage(
  id: string,
  query: { tab?: EntryStatusTab; page?: number; limit?: number; search?: string } = {},
): Promise<{ entries: CustomerListEntry[]; total: number }> {
  const { data } = await apiClient.get(`/customer-lists/${id}/entries`, {
    params: { tab: query.tab ?? 'all', page: query.page ?? 1, limit: query.limit ?? 50, search: query.search || undefined },
  });
  return { entries: listFromEnvelope<CustomerListEntry>(data, ['entries', 'data']), total: (data as { total?: number }).total ?? 0 };
}

export async function fetchCustomerListEntries(
  id: string,
  query: { tab?: EntryStatusTab; page?: number; limit?: number; search?: string } = {},
): Promise<CustomerListEntry[]> {
  const { entries } = await fetchCustomerListEntriesPage(id, query);
  return entries;
}

export async function updateListEntry(
  listId: string,
  entryId: string,
  patch: CustomerListEntryPatch,
): Promise<{ entry: CustomerListEntry; conflictWarn?: boolean; dupWithListName?: string | null }> {
  const { data } = await apiClient.patch(`/customer-lists/${listId}/entries/${entryId}`, patch);
  return data as { entry: CustomerListEntry; conflictWarn?: boolean; dupWithListName?: string | null };
}

export async function addListEntries(listId: string, rawText: string): Promise<{ ok: true; added: number; valid: number; invalid: number }> {
  const { data } = await apiClient.post(`/customer-lists/${listId}/entries`, { rawText });
  return data as { ok: true; added: number; valid: number; invalid: number };
}

export async function deleteListEntry(listId: string, entryId: string): Promise<void> {
  await apiClient.delete(`/customer-lists/${listId}/entries/${entryId}`);
}

export async function bulkResolveListEntries(
  listId: string,
  entryIds: string[],
  action: 'skip' | 'overwrite' | 'keep_both' | 'delete',
): Promise<{ ok: boolean; affected?: number }> {
  const { data } = await apiClient.post(`/customer-lists/${listId}/entries/bulk`, { entryIds, action });
  return data as { ok: boolean; affected?: number };
}
