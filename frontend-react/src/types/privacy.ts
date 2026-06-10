export interface PrivacySession {
  id: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  unlockedAt: string;
}

export interface PrivacyStatus {
  hasPin: boolean;
  lockedUntil: string | null;
  activeSessionCount: number;
  activeSessions: PrivacySession[];
}
