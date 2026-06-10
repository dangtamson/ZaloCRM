export interface KpiData {
  messagesToday: number;
  messagesUnreplied: number;
  messagesUnread: number;
  appointmentsToday: number;
  newContactsThisWeek: number;
  totalContacts: number;
}

export interface MessageVolumeItem {
  date: string;
  sent: number;
  received: number;
}

export interface CountValue {
  _all: number;
}

export interface PipelineItem {
  status: string | null;
  _count?: CountValue | number;
  count?: number;
}

export interface SourceItem {
  source: string;
  _count?: CountValue | number;
  count?: number;
}

export interface AppointmentStatusItem {
  status: string;
  _count?: CountValue | number;
  count?: number;
}

export function getCount(value: CountValue | number | undefined): number {
  if (typeof value === 'number') return value;
  return value?._all ?? 0;
}
