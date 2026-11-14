import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useStopArrivals } from './useStopArrivals';
import { liveApiClient } from '@/services/liveApi';
import type { Arrival } from '@/types/api';

const arrivals: Arrival[] = [
  {
    lineCode: '33',
    destination: 'CENES DE LA VEGA',
    minutes: 4,
    scheduledTime: '14:47',
    isRealTime: true,
  },
];

describe('useStopArrivals', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(liveApiClient, 'getCachedArrivals').mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fetch when there is no stop code', async () => {
    const spy = vi.spyOn(liveApiClient, 'getStopArrivals');

    const { result } = await renderHook(() => useStopArrivals(null));

    await act(async () => {});
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.arrivals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads arrivals and records the update time', async () => {
    const spy = vi
      .spyOn(liveApiClient, 'getStopArrivals')
      .mockResolvedValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 0));

    await waitFor(() => expect(result.current.arrivals).toHaveLength(1));
    expect(spy).toHaveBeenCalledWith('9');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeTypeOf('number');
  });

  it('surfaces errors and falls back to cached arrivals', async () => {
    vi.spyOn(liveApiClient, 'getStopArrivals').mockRejectedValue(
      new Error('boom'),
    );
    vi.spyOn(liveApiClient, 'getCachedArrivals').mockReturnValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 0));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('boom');
    expect(result.current.arrivals).toEqual(arrivals);
  });

  it('refreshes on the interval', async () => {
    vi.useFakeTimers();
    const spy = vi
      .spyOn(liveApiClient, 'getStopArrivals')
      .mockResolvedValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 30_000));

    // Flush the initial fetch.
    await act(async () => {
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.current.arrivals).toHaveLength(1);
  });

  it('refresh() reloads on demand', async () => {
    const spy = vi
      .spyOn(liveApiClient, 'getStopArrivals')
      .mockResolvedValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 0));
    await waitFor(() => expect(result.current.arrivals).toHaveLength(1));

    await act(async () => {
      await result.current.refresh();
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('survives a cache that throws instead of crashing the screen', async () => {
    vi.spyOn(liveApiClient, 'getStopArrivals').mockRejectedValue(new Error('network down'));
    vi.spyOn(liveApiClient, 'getCachedArrivals').mockImplementation(() => {
      throw new TypeError('undefined is not a function');
    });

    const { result } = await renderHook(() => useStopArrivals('9', 0));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.arrivals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('silently ignores a manual refresh during the cooldown window', async () => {
    const spy = vi.spyOn(liveApiClient, 'getStopArrivals').mockResolvedValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 0));

    // Initial load.
    await waitFor(() => expect(result.current.arrivals).toHaveLength(1));
    expect(spy).toHaveBeenCalledTimes(1);

    // First manual refresh goes through.
    await act(async () => {
      await result.current.refresh();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // Taps inside the cooldown are no-ops: no error, no loading state, no request.
    await act(async () => {
      await result.current.refresh();
      await result.current.refresh();
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    // The button stays visually unchanged: nothing exposes the cooldown.
    expect(result.current).not.toHaveProperty('refreshCooldownMs');
  });

  it('allows a manual refresh again once the cooldown elapses', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(liveApiClient, 'getStopArrivals').mockResolvedValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 0));

    await act(async () => {
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // Blocked immediately after.
    await act(async () => {
      await result.current.refresh();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // Still blocked just before the window ends.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // Allowed once the window has passed.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('keeps the periodic poll running regardless of the refresh cooldown', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(liveApiClient, 'getStopArrivals').mockResolvedValue(arrivals);

    const { result } = await renderHook(() => useStopArrivals('9', 30_000));

    await act(async () => {
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // Burn the manual refresh, then wait past its cooldown.
    await act(async () => {
      await result.current.refresh();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // Two poll intervals elapse; the automatic refresh is not throttled.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('clears data when the stop code becomes empty', async () => {
    vi.spyOn(liveApiClient, 'getStopArrivals').mockResolvedValue(arrivals);

    const { result, rerender } = await renderHook(
      ({ code }: { code: string | null }) => useStopArrivals(code, 0),
      { initialProps: { code: '9' as string | null } },
    );

    await waitFor(() => expect(result.current.arrivals).toHaveLength(1));

    rerender({ code: null });
    await waitFor(() => expect(result.current.arrivals).toEqual([]));
  });
});
