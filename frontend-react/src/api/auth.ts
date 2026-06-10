import { apiClient } from './client';
import type { AuthResponse, BackendProfile, SetupInput } from '../types/auth';

export async function checkSetup(): Promise<boolean> {
  const { data } = await apiClient.get<{ needsSetup: boolean }>('/setup/status');
  return data.needsSetup;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function setup(input: SetupInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/setup', input);
  return data;
}

export async function fetchProfile(): Promise<BackendProfile> {
  const { data } = await apiClient.get<BackendProfile>('/profile');
  return data;
}
