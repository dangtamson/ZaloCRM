import { apiClient } from './client';
import type { AutomationBlock, AutomationBroadcast, AutomationSequence, AutomationTrigger, CustomerListEntry, CustomerListSummary } from '../types/automation';

type Envelope<T> = T | {
  data?: T;
  triggers?: T;
  blocks?: T;
  sequences?: T;
  broadcasts?: T;
  lists?: T;
  entries?: T;
  list?: T;
};

function fromEnvelope<T>(payload: Envelope<T[]>, key: keyof Exclude<Envelope<T[]>, T[]>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload[key] ?? payload.data ?? [];
}

export async function fetchAutomationTriggers(): Promise<AutomationTrigger[]> {
  const { data } = await apiClient.get<Envelope<AutomationTrigger[]>>('/automation/triggers');
  return fromEnvelope(data, 'triggers');
}

export async function fetchAutomationBlocks(): Promise<AutomationBlock[]> {
  const { data } = await apiClient.get<Envelope<AutomationBlock[]>>('/automation/blocks', { params: { includeArchived: true, limit: 500 } });
  return fromEnvelope(data, 'blocks');
}

export async function fetchAutomationSequences(): Promise<AutomationSequence[]> {
  const { data } = await apiClient.get<Envelope<AutomationSequence[]>>('/automation/sequences');
  return fromEnvelope(data, 'sequences');
}

export async function fetchAutomationBroadcasts(): Promise<AutomationBroadcast[]> {
  const { data } = await apiClient.get<Envelope<AutomationBroadcast[]>>('/automation/broadcasts');
  return fromEnvelope(data, 'broadcasts');
}

export async function fetchCustomerLists(): Promise<CustomerListSummary[]> {
  const { data } = await apiClient.get<Envelope<CustomerListSummary[]>>('/customer-lists', { params: { status: 'active', limit: 100 } });
  return fromEnvelope(data, 'lists');
}

export async function fetchCustomerList(id: string): Promise<CustomerListSummary> {
  const { data } = await apiClient.get<Envelope<CustomerListSummary>>(`/customer-lists/${id}`);
  if ('list' in data && data.list) return data.list;
  if ('data' in data && data.data) return data.data;
  return data as CustomerListSummary;
}

export async function fetchCustomerListEntries(id: string): Promise<CustomerListEntry[]> {
  const { data } = await apiClient.get<Envelope<CustomerListEntry[]>>(`/customer-lists/${id}/entries`, { params: { page: 1, limit: 100 } });
  return fromEnvelope(data, 'entries');
}
