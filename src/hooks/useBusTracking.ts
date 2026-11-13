// Bus Tracking Hook
import { useCallback, useState } from 'react';
import { useTrackingStore } from '@/store/tracking';
import { BusPosition, ArrivalPrediction } from '@/types/tracking';

export function useBusTracking() {
  const { trackedPairs } = useTrackingStore();
  const [busPositions, setBusPositions] = useState<Map<string, BusPosition>>(new Map());
  const [arrivals, setArrivals] = useState<Map<string, ArrivalPrediction[]>>(new Map());
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    // TODO: Start background fetch and real-time updates
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    // TODO: Stop background fetch
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

  return {
    trackedPairs,
    busPositions,
    arrivals,
    isTracking,
    startTracking,
    stopTracking,
    updateBusPosition,
    updateArrivals,
  };
}