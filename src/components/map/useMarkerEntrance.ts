// Entrance animation shared by map markers.
//
// Every marker that enters the viewport mounts a fresh component, so animating
// on mount gives added stops a fade + scale-in as the user pans or zooms the
// map. Markers that stay in view keep their value and never replay it.
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

/** How long a marker takes to fade/scale in. */
export const MARKER_ENTRANCE_DURATION_MS = 200;

/** Animated progress value at the start/end of the entrance animation. */
export const MARKER_ENTRANCE_FROM = 0;
export const MARKER_ENTRANCE_TO = 1;

export interface MarkerEntranceStyle {
  opacity: Animated.Value;
  transform: { scale: Animated.Value }[];
}

/**
 * Returns an animated style that fades + scales a marker in on mount.
 *
 * @param enabled when false the marker is rendered at full size immediately
 *   (useful for markers that must not animate, e.g. a focused stop).
 */
export function useMarkerEntrance(enabled = true): MarkerEntranceStyle {
  // Stable Animated.Value for the marker entrance (useState so it is created
  // once, matching the live-dot pulse in AppHeader).
  const [progress] = useState(
    () => new Animated.Value(enabled ? MARKER_ENTRANCE_FROM : MARKER_ENTRANCE_TO)
  );

  useEffect(() => {
    if (!enabled) {
      progress.setValue(MARKER_ENTRANCE_TO);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: MARKER_ENTRANCE_TO,
      duration: MARKER_ENTRANCE_DURATION_MS,
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [enabled, progress]);

  // Opacity and scale both ride the same 0 → 1 progress value.
  return {
    opacity: progress,
    transform: [{ scale: progress }],
  };
}

export default useMarkerEntrance;
