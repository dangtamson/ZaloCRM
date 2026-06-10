type Envelope<T> = T | Record<string, unknown>;

export function listFromEnvelope<T>(payload: Envelope<T[]>, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export function itemFromEnvelope<T>(payload: Envelope<T>, keys: string[]): T {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload as T;
  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return payload as T;
}
