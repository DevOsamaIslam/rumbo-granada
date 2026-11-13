# 11 — Background Tasks

## Background Fetch Configuration

```ts
// app.config.ts
export default {
  expo: {
    plugins: [
      'expo-notifications',
      'expo-task-manager',
      [
        'expo-background-fetch',
        {
          minimumInterval: 15, // minutes (iOS minimum)
        },
      ],
    ],
    ios: {
      backgroundModes: ['location', 'fetch', 'remote-notification'],
      infoPlist: {
        UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
      },
    },
    android: {
      permissions: [
        'RECEIVE_BOOT_COMPLETED',
        'WAKE_LOCK',
        'FOREGROUND_SERVICE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
    },
  },
};
```

## Background Task Registration (`src/services/background.ts`)

```ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useTrackingStore } from '@/store/tracking';
import { liveApiClient } from '@/services/liveApi';
import { sendArrivalNotification } from '@/services/notifications';

const BACKGROUND_FETCH_TASK = 'background-bus-tracking';

export async function registerBackgroundFetch() {
  // Define the task
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      const trackedPairs = useTrackingStore.getState().trackedPairs.filter(p => p.active);
      
      for (const pair of trackedPairs) {
        const arrivals = await liveApiClient.getStopArrivals(pair.stopCode);
        const busArrival = arrivals.find(a => a.lineCode === pair.busLineCode && a.busId === pair.busId);
        
        if (busArrival && (busArrival.distance <= pair.thresholdMeters || busArrival.minutes <= 2)) {
          await sendArrivalNotification(pair, busArrival);
          useTrackingStore.getState().updateTracking(pair.busId, pair.stopId, { active: false });
        }
      }
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background fetch failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register with system
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15, // minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundFetch() {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}
```

## Battery Optimization (Android)

```tsx
// src/hooks/useBatteryOptimization.ts
import { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';

export function useBatteryOptimization() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const checkAndRequest = async () => {
      // Check if app is in battery optimization whitelist
      // If not, prompt user to disable optimization for reliable background tracking
      const isIgnoring = await checkIgnoringBatteryOptimizations();
      if (!isIgnoring) {
        Alert.alert(
          'Battery Optimization',
          'For reliable bus tracking notifications, please disable battery optimization for Granabus.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    };

    checkAndRequest();
  }, []);
}

async function checkIgnoringBatteryOptimizations(): Promise<boolean> {
  // Use react-native-battery-optimization or native module
  return false; // Placeholder
}
```

## App State Handling (`src/hooks/useAppState.ts`)

```tsx
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useBusTracking } from './useBusTracking';

export function useAppState() {
  const { trackedPairs, checkArrival } = useBusTracking();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      // App came to foreground - check all active tracking immediately
      for (const pair of trackedPairs.filter(p => p.active)) {
        await checkArrival(pair);
      }
    } else if (nextState === 'background') {
      // App went to background - background fetch will handle periodic checks
      console.log('App backgrounded, background fetch active');
    }
  };
}
```

## Persistence for Background Restore

Tracking state persisted in MMKV (via Zustand persist middleware) survives app kill. On restart, background task re-registers and continues monitoring.