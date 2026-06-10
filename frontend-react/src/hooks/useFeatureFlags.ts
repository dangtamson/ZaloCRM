import { useSyncExternalStore } from 'react';

let featureSet = new Set<string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): Set<string> {
  return featureSet;
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setFeatures(features: string[]): void {
  featureSet = new Set(features);
  emit();
}

export function useFeatureFlags() {
  const features = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    hasFeature: (feature: string) => features.has(feature),
  };
}
