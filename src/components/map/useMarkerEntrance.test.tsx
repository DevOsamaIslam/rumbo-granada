import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react-native';
import {
  MARKER_ENTRANCE_DURATION_MS,
  MARKER_ENTRANCE_FROM,
  MARKER_ENTRANCE_TO,
  useMarkerEntrance,
} from './useMarkerEntrance';

/** Reads the current value of an Animated.Value (internal RN accessor). */
function animatedValue(value: unknown): number {
  return (value as { __getValue: () => number }).__getValue();
}

describe('useMarkerEntrance', () => {
  it('starts transparent and scales in on mount', async () => {
    const { result } = await renderHook(() => useMarkerEntrance());

    expect(animatedValue(result.current.opacity)).toBe(MARKER_ENTRANCE_FROM);
    expect(result.current.transform).toHaveLength(1);
    // Opacity and scale ride the same progress value.
    expect(result.current.transform[0].scale).toBe(result.current.opacity);
  });

  it('renders at full size immediately when the animation is disabled', async () => {
    const { result } = await renderHook(() => useMarkerEntrance(false));

    expect(animatedValue(result.current.opacity)).toBe(MARKER_ENTRANCE_TO);
  });

  it('uses a short, noticeable duration', () => {
    expect(MARKER_ENTRANCE_DURATION_MS).toBeGreaterThanOrEqual(100);
    expect(MARKER_ENTRANCE_DURATION_MS).toBeLessThanOrEqual(400);
    expect(MARKER_ENTRANCE_TO).toBeGreaterThan(MARKER_ENTRANCE_FROM);
  });
});
