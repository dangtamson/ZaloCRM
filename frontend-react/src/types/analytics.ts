export interface FunnelStage {
  status: string;
  count: number;
  rate: number;
}

export interface ConversionFunnelData {
  stages: FunnelStage[];
  totalContacts: number;
  avgConversionDays: number | null;
}

export interface TeamMember {
  userId: string;
  fullName: string;
  messagesSent: number;
  contactsConverted: number;
  appointmentsCompleted: number;
  avgResponseTime: number | null;
}

export interface TeamPerformanceData {
  users: TeamMember[];
}

export interface ResponseTimeData {
  daily: { date: string; avgSeconds: number }[];
  overall: number | null;
  byUser: { userId: string; fullName: string; avgSeconds: number }[];
}

export interface ReportConfig {
  metrics: string[];
  groupBy: string;
  dateRange: { from: string; to: string };
  filters?: { userId?: string; source?: string; status?: string };
}

export interface CustomReportResult {
  labels: string[];
  datasets: { metric: string; data: number[] }[];
}

export interface SavedReport {
  id: string;
  name: string;
  type: string;
  config: unknown;
  createdAt: string;
}
