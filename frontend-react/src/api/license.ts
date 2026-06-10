import { apiClient } from './client';

export async function fetchLicenseFeatures(): Promise<string[]> {
  const { data } = await apiClient.get<{ features?: unknown }>('/license');
  return Array.isArray(data.features) ? data.features.filter((feature): feature is string => typeof feature === 'string') : [];
}
