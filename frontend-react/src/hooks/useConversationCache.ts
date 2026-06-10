import { useMemo, useRef } from 'react';
import type { ChatMessage } from '../types/chat';

export function useConversationCache() {
  const messagesRef = useRef(new Map<string, ChatMessage[]>());

  return useMemo(() => ({
    getMessages(conversationId: string) {
      return messagesRef.current.get(conversationId) ?? null;
    },
    setMessages(conversationId: string, messages: ChatMessage[]) {
      messagesRef.current.set(conversationId, messages);
    },
  }), []);
}
