export interface ChatContact {
  id: string;
  fullName?: string | null;
  crmName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  leadScore?: number | null;
}

export interface ChatConversation {
  id: string;
  threadType: 'user' | 'group';
  contact?: ChatContact | null;
  groupName?: string | null;
  groupMembersCount?: number | null;
  externalThreadId?: string | null;
  zaloAccount?: { id: string; displayName?: string | null; avatarUrl?: string | null } | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
  isReplied?: boolean;
  isPinned?: boolean;
}

export interface ChatMessage {
  id: string;
  content?: string | null;
  contentType?: string | null;
  senderType?: string | null;
  senderName?: string | null;
  sentAt?: string | null;
  isDeleted?: boolean;
  zaloMsgId?: string | null;
  redacted?: boolean;
}
