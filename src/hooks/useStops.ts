// Stops Hook
import { useCallback, useState, useEffect } from 'react';
import { Stop, StopTime } from '@/types/gtfs';
import { gtfsService } from '@/services/gtfs';

export function useStops() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopTimes, setStopTimes] = useState<StopTime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadStopsForRoute = useCallback(async (routeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await gtfsService.load();
      const data = gtfsService.getStopsForRoute(routeId);
      setStops(data);
    } catch {
      setError(new Error('Failed to load stops'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOrderedStopsForRoute = useCallback(async (routeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await gtfsService.load();
      const data = gtfsService.getOrderedStopsForRoute(routeId);
      setStops(data);
    } catch {
      setError(new Error('Failed to load stops'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStopTimes = useCallback(async (tripId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await gtfsService.load();
      const data = gtfsService.getStopTimesForTrip(tripId);
      setStopTimes(data);
    } catch {
      setError(new Error('Failed to load stop times'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllStops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await gtfsService.load();
      setStops(gtfsService.getStops());
    } catch {
      setError(new Error('Failed to load stops'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchStops = useCallback((query: string): Stop[] => {
    const lowerQuery = query.toLowerCase();
    return stops.filter(
      (stop) =>
        stop.stop_name.toLowerCase().includes(lowerQuery) ||
        stop.stop_code?.toLowerCase().includes(lowerQuery)
    );
  }, [stops]);

  // Automatically load stops on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllStops();
  }, [loadAllStops]);

  return {
    stops,
    stopTimes,
    isLoading,
    error,
    loadStopsForRoute,
    loadOrderedStopsForRoute,
    loadStopTimes,
    loadAllStops,
    searchStops,
  };
}