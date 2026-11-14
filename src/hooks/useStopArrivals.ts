// Stop arrivals hook: polls the live API on an interval.
import { useCallback, useEffect, useRef, useState } from 'react';
import { liveApiClient, LiveApiError } from '@/services/liveApi';
import type { Arrival } from '@/types/api';

export interface UseStopArrivalsResult {
  arrivals: Arrival[];
  isLoading: boolean;
  error: Error | null;
  /** Timestamp (ms) of the last successful fetch, for 'updated Xs ago'. */
  lastUpdated: number | null;
  refresh: () => Promise<void>;
}

/** Default polling interval: the site itself refreshes its page every 30s. */
export const ARRIVALS_REFRESH_MS = 30_000;

/**
 * Minimum gap between two manual refreshes. The upstream site is a plain HTML
 * endpoint with no rate limit of its own, so this protects it (and the battery)
 * from impatient tapping. The throttle is silent: the button stays enabled and
 * ignored taps simply do nothing.
 */
export const MANUAL_REFRESH_COOLDOWN_MS = 30_000;

/**
 * Reads the cached arrivals without ever throwing. A cache failure must not turn
 * into a render error on the stop screen.
 */
function safeCachedArrivals(stopCode: string): Arrival[] {
  try {
    return liveApiClient.getCachedArrivals(stopCode) ?? [];
  } catch {
    return [];
  }
}

/**
 * Loads the live arrivals for a stop code and refreshes them on an interval.
 *
 * `stopCode` is the GTFS `stop_code`; pass `null` to stay idle (the hook then does
 * not fetch and reports no data).
 */
export function useStopArrivals(
  stopCode: string | null | undefined,
  refreshIntervalMs: number = ARRIVALS_REFRESH_MS,
): UseStopArrivalsResult {
  const code = stopCode ?? null;
  const [state, setState] = useState<{
    code: string | null;
    arrivals: Arrival[];
    isLoading: boolean;
    error: Error | null;
    lastUpdated: number | null;
  }>({
    code: null,
    arrivals: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Guards against a slow response overwriting a newer one.
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  // Timestamp before which manual refreshes are ignored. This is intentionally
  // invisible to the user: the button stays enabled, but taps are a no-op so the
  // upstream HTML endpoint is not hammered.
  const manualRefreshBlockedUntilRef = useRef(0);

  const load = useCallback(async (requestedCode: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await liveApiClient.getStopArrivals(requestedCode);
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setState({
        code: requestedCode,
        arrivals: result,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const error =
        err instanceof LiveApiError
          ? err
          : new LiveApiError(
              err instanceof Error ? err.message : 'Failed to load arrivals',
            );

      // Surface the real failure in dev so a broken native module is visible.
      if (__DEV__) {
        console.warn('[useStopArrivals] load failed', {
          code: requestedCode,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      }
      setState((prev) => {
        // Keep showing the previous arrivals (or the cached ones) on failure.
        const cached =
          prev.code === requestedCode && prev.arrivals.length > 0
            ? prev.arrivals
            : safeCachedArrivals(requestedCode);

        return {
          code: requestedCode,
          arrivals: cached,
          isLoading: false,
          error,
          lastUpdated: prev.code === requestedCode ? prev.lastUpdated : null,
        };
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!code) return;

    // Kick off the fetch outside the effect body: `load` sets state synchronously
    // before its first await, which the react-hooks lint rule (correctly) flags as
    // a cascading render inside an effect.
    void Promise.resolve().then(() => load(code));

    if (refreshIntervalMs <= 0) return;
    const timer = setInterval(() => {
      load(code);
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [code, refreshIntervalMs, load]);

  const refresh = useCallback(async () => {
    if (!code) return;
    // Silently ignore taps inside the cooldown window: no spinner, no error, no
    // countdown. The periodic poll keeps data fresh regardless.
    if (Date.now() < manualRefreshBlockedUntilRef.current) return;
    manualRefreshBlockedUntilRef.current = Date.now() + MANUAL_REFRESH_COOLDOWN_MS;
    await load(code);
  }, [code, load]);

  // Reset derived state when the caller switches to another stop (or to none):
  // the previous stop's arrivals must not leak into the new one.
  const isCurrent = state.code === code;

  return {
    arrivals: isCurrent ? state.arrivals : [],
    isLoading: isCurrent ? state.isLoading : code !== null,
    error: isCurrent ? state.error : null,
    lastUpdated: isCurrent ? state.lastUpdated : null,
    refresh,
  };
}
