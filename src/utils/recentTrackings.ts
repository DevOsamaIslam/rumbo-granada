// Helpers for the "recent trackings" history.
//
// Tracked pairs are removed from the active list when tracking is stopped, so
// the store keeps a separate, persisted, de-duplicated history that the
// Favorites screen and the header dropdown can show as quick re-enable targets.
import type { TrackedPair } from '@/types/tracking';

/** Maximum number of recent trackings retained. */
export const MAX_RECENT_TRACKINGS = 10;

/** Identity of a tracking target, regardless of the generated pair id. */
export function trackedPairKey(
  pair: Pick<TrackedPair, 'routeId' | 'stopId'>,
): string {
  return `${pair.routeId}:${pair.stopId}`;
}

/**
 * Puts `pair` at the front of the recent list, removing any previous entry for
 * the same route+stop and capping the list length.
 */
export function mergeRecentTrackings(
  recent: TrackedPair[],
  pair: TrackedPair,
  limit: number = MAX_RECENT_TRACKINGS,
): TrackedPair[] {
  const key = trackedPairKey(pair);
  const others = recent.filter((entry) => trackedPairKey(entry) !== key);
  return [pair, ...others].slice(0, limit);
}

/** Finds the currently enabled tracked pair that matches a recent entry. */
export function findEnabledPair(
  trackedPairs: TrackedPair[],
  recent: Pick<TrackedPair, 'routeId' | 'stopId'>,
): TrackedPair | undefined {
  const key = trackedPairKey(recent);
  return trackedPairs.find(
    (pair) => pair.enabled && trackedPairKey(pair) === key,
  );
}
