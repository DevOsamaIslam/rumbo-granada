// Lines Hook
import { useCallback, useState, useEffect } from 'react';
import { Route } from '@/types/gtfs';
import { gtfsService } from '@/services/gtfs';

export function useLines() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadLines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await gtfsService.load();
      const data = gtfsService.getRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLines();
  }, [loadLines]);

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