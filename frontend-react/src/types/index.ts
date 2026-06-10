export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export type Nullable<T> = T | null;

export type { AuthResponse, BackendProfile, SetupInput, User } from './auth';
export type { PrivacySession, PrivacyStatus } from './privacy';
export type { DepartmentNode, PermissionGroupNode, RbacMatrixMeta, RbacUser } from './rbac';
export type { AppointmentStatusItem, KpiData, MessageVolumeItem, PipelineItem, SourceItem } from './dashboard';
export type { ConversionFunnelData, CustomReportResult, ReportConfig, ResponseTimeData, SavedReport, TeamPerformanceData } from './analytics';
