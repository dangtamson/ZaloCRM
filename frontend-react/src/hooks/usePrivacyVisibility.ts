import type { ChatConversation, ChatMessage } from '../types/chat';
import { usePrivacyStore } from '../store/privacy';

export function usePrivacyVisibility() {
  const unlocked = usePrivacyStore((state) => state.isUnlocked());

  return {
    canReadConversation: (_conversation: ChatConversation | null) => true,
    visibleMessageContent: (message: ChatMessage) => (message.redacted && !unlocked ? 'Tin nhắn riêng tư' : message.content ?? ''),
  };
}
