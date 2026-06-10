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
