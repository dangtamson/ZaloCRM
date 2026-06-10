import type { ChatConversation, ChatMessage } from '../types/chat';

export function usePrivacyVisibility() {
  return {
    canReadConversation: (_conversation: ChatConversation | null) => true,
    visibleMessageContent: (message: ChatMessage) => (message.redacted ? 'Tin nhắn riêng tư' : message.content ?? ''),
  };
}
