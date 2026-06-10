import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchConversationMessages, fetchConversations, sendConversationMessage } from '../api/chat';
import type { ChatConversation, ChatMessage } from '../types/chat';
import { subscribeChatSocket } from './chatSocket';
import { useConversationCache } from './useConversationCache';

export function useChat(initialConversationId?: string) {
  const cache = useConversationCache();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId ?? '');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const result = await fetchConversations();
      setConversations(result);
      if (!selectedConversationId && result[0]) setSelectedConversationId(result[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hội thoại');
    } finally {
      setLoadingConversations(false);
    }
  }, [selectedConversationId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const cached = cache.getMessages(conversationId);
    if (cached) setMessages(cached);
    setLoadingMessages(!cached);
    setError(null);
    try {
      const result = await fetchConversationMessages(conversationId);
      cache.setMessages(conversationId, result);
      setMessages(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  }, [cache]);

  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!selectedConversationId || !content.trim()) return;
    setSending(true);
    try {
      const message = await sendConversationMessage(selectedConversationId, content);
      setMessages((current) => {
        const next = [...current, message];
        cache.setMessages(selectedConversationId, next);
        return next;
      });
    } finally {
      setSending(false);
    }
  }, [cache, selectedConversationId]);

  useEffect(() => {
    return subscribeChatSocket('chat:message', ({ conversationId, message }) => {
      setConversations((current) => {
        const index = current.findIndex((conversation) => conversation.id === conversationId);
        if (index === -1) return current;
        const next = [...current];
        const updated = {
          ...next[index],
          lastMessageAt: message.sentAt ?? next[index].lastMessageAt,
          unreadCount: conversationId === selectedConversationId ? 0 : (next[index].unreadCount ?? 0) + 1,
        };
        next.splice(index, 1);
        return [updated, ...next];
      });

      if (conversationId !== selectedConversationId) return;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        const next = [...current, message].sort((a, b) => new Date(a.sentAt ?? '').getTime() - new Date(b.sentAt ?? '').getTime());
        cache.setMessages(conversationId, next);
        return next;
      });
    });
  }, [cache, selectedConversationId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedConversationId) void loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  return {
    conversations,
    messages,
    selectedConversation,
    selectedConversationId,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    selectConversation,
    sendMessage,
  };
}
