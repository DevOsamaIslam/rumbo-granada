// Lines Hook
import { useCallback, useState } from 'react';
import { Route } from '@/types/gtfs';

export function useLines() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadLines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Load from GTFS service
      // const data = await gtfsService.getRoutes();
      // setRoutes(data);
      setRoutes([]); // Placeholder
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchLines = useCallback((query: string): Route[] => {
    const lowerQuery = query.toLowerCase();
    return routes.filter(
      (route) =>
        route.route_short_name.toLowerCase().includes(lowerQuery) ||
        route.route_long_name.toLowerCase().includes(lowerQuery)
    );
  }, [routes]);

  return {
    routes,
    isLoading,
    error,
    loadLines,
    searchLines,
  };
}