import { describe, it, expect } from 'vitest';
import type { TrackedPair } from '@/types/tracking';
import {
  findEnabledPair,
  mergeRecentTrackings,
  trackedPairKey,
} from './recentTrackings';

const makePair = (overrides: Partial<TrackedPair> = {}): TrackedPair => ({
  id: 'p1',
  routeId: 'r1',
  routeShortName: '33',
  stopId: 's1',
  stopCode: '74',
  stopName: 'Gran Vía',
  label: 'Gran Vía',
  thresholdMinutes: 5,
  enabled: true,
  createdAt: 0,
  ...overrides,
});

describe('trackedPairKey', () => {
  it('identifies a target by route and stop', () => {
    expect(trackedPairKey({ routeId: 'r1', stopId: 's1' })).toBe('r1:s1');
  });
});

describe('mergeRecentTrackings', () => {
  it('puts the newest entry first', () => {
    const first = makePair({ routeId: 'r1' });
    const second = makePair({ routeId: 'r2' });
    const result = mergeRecentTrackings([first], second);
    expect(result.map((p) => p.routeId)).toEqual(['r2', 'r1']);
  });

  it('de-duplicates by route and stop while keeping the newest copy', () => {
    const old = makePair({ label: 'Old' });
    const fresh = makePair({ label: 'Fresh' });
    const result = mergeRecentTrackings([old], fresh);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Fresh');
  });

  it('caps the history length', () => {
    const recent = Array.from({ length: 3 }, (_, i) =>
      makePair({ routeId: `r${i}`, stopId: `s${i}` }),
    );
    const result = mergeRecentTrackings(recent, makePair({ routeId: 'new', stopId: 'new' }), 2);
    expect(result).toHaveLength(2);
    expect(result[0].routeId).toBe('new');
  });
});

describe('findEnabledPair', () => {
  it('finds an enabled pair matching the recent target', () => {
    const enabled = makePair({ id: 'a' });
    const disabled = makePair({ id: 'b', enabled: false, routeId: 'r2' });
    expect(findEnabledPair([disabled, enabled], enabled)?.id).toBe('a');
  });

  it('ignores disabled pairs and mismatches', () => {
    expect(findEnabledPair([makePair({ enabled: false })], makePair())).toBeUndefined();
    expect(findEnabledPair([makePair()], makePair({ routeId: 'other' }))).toBeUndefined();
  });
});
