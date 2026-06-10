import { apiClient } from './client';
import type { Appointment, Contact, ContactProfileResponse, Friend, Group, TimelineItem, ZaloAccount } from '../types/crm';

type Envelope<T> = T | { data?: T; contacts?: T; friends?: T; groups?: T; appointments?: T; items?: T };

function listFromEnvelope<T>(payload: Envelope<T[]>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload.contacts ?? payload.friends ?? payload.groups ?? payload.appointments ?? payload.items ?? [];
}

export async function fetchContacts(): Promise<Contact[]> {
  const { data } = await apiClient.get<Envelope<Contact[]>>('/contacts');
  return listFromEnvelope(data);
}

export async function fetchContact(id: string): Promise<Contact> {
  const { data } = await apiClient.get<Contact | { data?: Contact }>(`/contacts/${id}`);
  if ('data' in data && data.data) return data.data;
  return data as Contact;
}

export async function fetchFriends(): Promise<Friend[]> {
  const { data } = await apiClient.get<Envelope<Friend[]>>('/friends');
  return listFromEnvelope(data);
}

export async function fetchGroups(): Promise<Group[]> {
  const { data } = await apiClient.get<Envelope<Group[]>>('/groups');
  return listFromEnvelope(data);
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<Envelope<Appointment[]>>('/appointments');
  return listFromEnvelope(data);
}

export async function fetchZaloAccounts(): Promise<ZaloAccount[]> {
  const { data } = await apiClient.get<Envelope<ZaloAccount[]>>('/zalo-accounts');
  return listFromEnvelope(data);
}

export async function fetchStuckLeads(): Promise<Friend[]> {
  const { data } = await apiClient.get<Envelope<Friend[]>>('/leads/stuck');
  return listFromEnvelope(data);
}

export async function fetchCustomerTimeline(customerId: string): Promise<TimelineItem[]> {
  const { data } = await apiClient.get<Envelope<TimelineItem[]>>(`/customers/${customerId}/timeline`, { params: { limit: 50 } });
  return listFromEnvelope(data);
}

export async function fetchContactProfile(contactId: string): Promise<ContactProfileResponse> {
  const { data } = await apiClient.get<ContactProfileResponse | { data?: ContactProfileResponse }>(`/contacts/${contactId}/profile`);
  if ('data' in data && data.data) return data.data;
  return data as ContactProfileResponse;
}
