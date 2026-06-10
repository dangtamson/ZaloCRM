export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  orgId: string;
  orgName: string;
  orgTimezone?: string;
}

export interface BackendProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  orgId: string;
  org?: {
    name?: string | null;
    timezone?: string | null;
  } | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SetupInput {
  orgName: string;
  fullName: string;
  email: string;
  password: string;
}
