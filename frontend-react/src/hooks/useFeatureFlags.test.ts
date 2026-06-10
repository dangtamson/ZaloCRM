import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setFeatures, useFeatureFlags } from './useFeatureFlags';

describe('useFeatureFlags', () => {
  beforeEach(() => {
    setFeatures([]);
  });

  it('returns false for unknown features by default', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.hasFeature('enterprise')).toBe(false);
  });

  it('reflects features loaded from the license API', () => {
    const { result } = renderHook(() => useFeatureFlags());

    act(() => setFeatures(['enterprise', 'automation']));

    expect(result.current.hasFeature('enterprise')).toBe(true);
    expect(result.current.hasFeature('automation')).toBe(true);
    expect(result.current.hasFeature('billing')).toBe(false);
  });
});
