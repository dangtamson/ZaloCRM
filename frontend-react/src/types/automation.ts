export type AutomationStatus = 'active' | 'archived' | 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled' | string;

export interface AutomationTrigger {
  id: string;
  name: string;
  eventType?: string | null;
  category?: string | null;
  bindingKind?: string | null;
  enabled?: boolean;
  sequence?: { name?: string | null } | null;
  broadcast?: { name?: string | null } | null;
}

export interface AutomationBlock {
  id: string;
  name: string;
  actionType?: string | null;
  channel?: string | null;
  usageCount?: number | null;
  archivedAt?: string | null;
  folder?: { name?: string | null } | null;
}

export interface AutomationSequence {
  id: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  enrolledCount?: number | null;
  completedCount?: number | null;
  failedCount?: number | null;
  steps?: Array<{ stepId: string; blockId: string; delayMinutes: number }>;
}

export interface AutomationBroadcast {
  id: string;
  name: string;
  state?: AutomationStatus;
  totalRecipients?: number | null;
  sentCount?: number | null;
  failedCount?: number | null;
  block?: { name?: string | null } | null;
}

export interface CustomerListSummary {
  id: string;
  name: string;
  status?: AutomationStatus;
  totalEntries?: number | null;
  sourceType?: string | null;
  updatedAt?: string | null;
}

export interface CustomerListEntry {
  id: string;
  displayName?: string | null;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
  note?: string | null;
}
