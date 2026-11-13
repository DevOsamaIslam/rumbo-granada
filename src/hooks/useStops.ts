// Stops Hook
import { useCallback, useState } from 'react';
import { Stop, StopTime } from '@/types/gtfs';

export function useStops() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopTimes, setStopTimes] = useState<StopTime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadStopsForRoute = useCallback(async (routeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Load from GTFS service
      // const data = await gtfsService.getStopsForRoute(routeId);
      // setStops(data);
      setStops([]); // Placeholder
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
      // TODO: Load from GTFS service
      // const data = await gtfsService.getStopTimesForTrip(tripId);
      // setStopTimes(data);
      setStopTimes([]); // Placeholder
    } catch {
      setError(new Error('Failed to load stop times'));
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

  return {
    stops,
    stopTimes,
    isLoading,
    error,
    loadStopsForRoute,
    loadStopTimes,
    searchStops,
  };
}