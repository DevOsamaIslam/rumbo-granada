// Bus Tracking Hook
import { useCallback, useState, useEffect } from 'react';
import { useTrackingStore } from '@/store/tracking';
import { BusPosition, ArrivalPrediction, TrackedPair } from '@/types/tracking';
import * as Notifications from 'expo-notifications';
import { liveApiClient } from '@/services/liveApi';

export function useBusTracking() {
  const { trackedPairs, toggleTracking: storeToggleTracking, addTrackedPair: storeAddTrackedPair, removeTrackedPair: storeRemoveTrackedPair, loadFromStorage } = useTrackingStore();
  const [busPositions, setBusPositions] = useState<Map<string, BusPosition>>(new Map());
  const [arrivals, setArrivals] = useState<Map<string, ArrivalPrediction[]>>(new Map());
  const [isTracking, setIsTracking] = useState(false);
  const [arrivalThreshold, setArrivalThreshold] = useState(5); // minutes

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    let cancelled = false;

    const pollArrivals = async () => {
      if (!isTracking) return;

      // Poll arrivals for each tracked pair
      const promises = trackedPairs
        .filter((p) => p.enabled)
        .map((pair) => liveApiClient.getStopArrivals(pair.stopId));

      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const arrivals = result.value;
          const pair = trackedPairs[index];
          if (pair && !cancelled) {
            updateArrivals(pair.stopId, arrivals);
          }
        }
      });
    };

    // Initial poll and then every 15 seconds
    const intervalId = setInterval(pollArrivals, 15_000);
    pollArrivals(); // Run immediately

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isTracking, trackedPairs, updateArrivals]);

  const startTracking = useCallback(() => {
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const updateBusPosition = useCallback((position: BusPosition) => {
    setBusPositions((prev) => {
      const next = new Map(prev);
      next.set(position.vehicleId, position);
      return next;
    });
  }, []);

  const updateArrivals = useCallback((stopId: string, predictions: ArrivalPrediction[]) => {
    setArrivals((prev) => {
      const next = new Map(prev);
      next.set(stopId, predictions);
      return next;
    });
  }, []);

  const toggleTracking = useCallback((id: string) => {
    storeToggleTracking(id);
    setIsTracking(prev => !prev);
  }, [storeToggleTracking]);

  const addTrackedPair = useCallback((pair: Omit<TrackedPair, 'id' | 'createdAt'>) => {
    storeAddTrackedPair(pair);
  }, []);

  const removeTrackedPair = useCallback((id: string) => {
    storeRemoveTrackedPair(id);
  }, []);

  const checkArrival = useCallback((stopId: string, vehicleId: string) => {
    const pair = trackedPairs.find(p => p.stopId === stopId && p.enabled);
    if (!pair) return;

    const predictions = arrivals.get(stopId) || [];
    const now = Date.now();
    const arrivalTime = predictions.find(p => p.vehicleId === vehicleId)?.arrivalTime || Infinity;
    const minutesUntilArrival = (arrivalTime - now) / 60000;

    if (minutesUntilArrival <= arrivalThreshold && minutesUntilArrival > 0) {
      // Check if we already notified recently
      const lastNotified = arrivals.get(stopId)?.find(p => p.vehicleId === vehicleId && p.realtime);
      if (!lastNotified) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bus Arrival',
            body: `Bus arriving at ${stopId} in ${Math.round(minutesUntilArrival)} minutes`,
          },
          trigger: null,
        });
      }
    }
  }, [trackedPairs, arrivals, arrivalThreshold]);

  return {
    trackedPairs,
    busPositions,
    arrivals,
    isTracking,
    arrivalThreshold,
    setArrivalThreshold,
    startTracking,
    stopTracking,
    updateBusPosition,
    updateArrivals,
    toggleTracking,
    addTrackedPair,
    removeTrackedPair,
    checkArrival,
  };
}