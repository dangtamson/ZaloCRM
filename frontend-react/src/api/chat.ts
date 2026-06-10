import { apiClient } from './client';
import type { ChatConversation, ChatMessage } from '../types/chat';

type ListEnvelope<T> = T[] | { conversations?: T[]; messages?: T[]; data?: T[] };

function listFrom<T>(payload: ListEnvelope<T>, key: 'conversations' | 'messages'): T[] {
  if (Array.isArray(payload)) return payload;
  return payload[key] ?? payload.data ?? [];
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  const { data } = await apiClient.get<ListEnvelope<ChatConversation>>('/conversations', { params: { limit: 100 } });
  return listFrom(data, 'conversations');
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ListEnvelope<ChatMessage>>(`/conversations/${conversationId}/messages`, { params: { limit: 100 } });
  return listFrom(data, 'messages');
}

export async function sendConversationMessage(conversationId: string, content: string): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content });
  return data;
}
