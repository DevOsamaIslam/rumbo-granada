# 10 — Notifications

## Overview

Local notifications triggered when a tracked bus reaches the user's selected stop. Uses `expo-notifications` with `expo-task-manager` for background execution.

## Types (`src/types/tracking.ts`)

```ts
export interface TrackedPair {
  id: string;
  busId: string;
  busLineCode: string;
  busDestination: string;
  stopId: string;
  stopCode: string;
  stopLabel: string;
  stopName: string;
  thresholdMeters: number;
  thresholdStops: number;
  createdAt: number;
  active: boolean;
}
## Notification Service (`src/services/notifications.ts`)

```ts
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { mmkvStorage } from '@/services/storage';
import { getDistance } from '@/utils/gtfs';
import type { TrackedPair, Arrival } from '@/types/tracking';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
  }),
});

const BACKGROUND_TASK = 'bus-tracking-task';

export async function registerBackgroundTask() {
  TaskManager.defineTask(BACKGROUND_TASK, async () => {
    const { useTrackingStore } = await import('@/store/tracking');
    const { liveApiClient } = await import('@/services/liveApi');
    const trackedPairs = useTrackingStore.getState().trackedPairs.filter(p => p.active);

    for (const pair of trackedPairs) {
      try {
        const arrivals = await liveApiClient.getStopArrivals(pair.stopCode);
        const busArrival = arrivals.find(a => a.lineCode === pair.busLineCode && a.busId === pair.busId);
        
        if (busArrival && (busArrival.distance <= pair.thresholdMeters || busArrival.minutes <= 2)) {
          await sendArrivalNotification(pair, busArrival);
          useTrackingStore.getState().updateTracking(pair.busId, pair.stopId, { active: false });
        }
      } catch (error) {
        console.warn(`Tracking check failed for ${pair.id}:`, error);
      }
    }

    return TaskManager.Result.Success;
  });
}

export async function sendArrivalNotification(pair: TrackedPair, arrival: Arrival) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚌 Bus ${pair.busLineCode} arriving!`,
      body: `Your bus to ${pair.busDestination} reaches ${pair.stopLabel} (${pair.stopName}) in ~${arrival.minutes} min`,
      data: { pairId: pair.id, type: 'bus-arrival' },
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}
```

## Tracking Hook (`src/hooks/useBusTracking.ts`)

```tsx
import { useCallback } from 'react';
import { useTrackingStore } from '@/store/tracking';
import { useSettingsStore } from '@/store/settings';
import { liveApiClient } from '@/services/liveApi';
import { sendArrivalNotification, requestNotificationPermissions } from '@/services/notifications';
import type { TrackedPair } from '@/types/tracking';

export function useBusTracking() {
  const { trackedPairs, addTracking, removeTracking, updateTracking } = useTrackingStore();
  const { arrivalThresholdMeters, arrivalThresholdStops } = useSettingsStore();

  const startTracking = useCallback(async (
    busId: string,
    busLineCode: string,
    busDestination: string,
    stopId: string,
    stopCode: string,
    stopLabel: string,
    stopName: string
  ) => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      alert('Notifications permission required for tracking');
      return;
    }

    const pair: TrackedPair = {
      id: `${busId}-${stopId}`,
      busId,
      busLineCode,
      busDestination,
      stopId,
      stopCode,
      stopLabel,
      stopName,
      thresholdMeters: arrivalThresholdMeters,
      thresholdStops: arrivalThresholdStops,
      createdAt: Date.now(),
      active: true,
    };

    addTracking(pair);
  }, [addTracking, arrivalThresholdMeters, arrivalThresholdStops]);

  const stopTracking = useCallback((busId: string, stopId: string) => {
    removeTracking(busId, stopId);
  }, [removeTracking]);

  return { trackedPairs, startTracking, stopTracking };
}
```

## UI: Start Tracking Modal

Modal with custom label input, shown from stop detail or favorites when user wants to track a bus to a stop.
```