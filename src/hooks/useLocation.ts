// Location Hook
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | 'granted' | 'denied' | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    return status === 'granted';
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError('Permiso de ubicación denegado');
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation: UserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
        timestamp: currentLocation.timestamp,
      };

      setLocation(userLocation);
      setError(null);
      return userLocation;
    } catch {
      setError('Error al obtener ubicación');
      return null;
    }
  }, [requestPermission]);

  const watchLocation = useCallback(
    (callback: (location: UserLocation) => void) => {
      let subscriber: Location.LocationSubscription | null = null;

      const startWatching = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            const userLocation: UserLocation = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy || 0,
              timestamp: newLocation.timestamp,
            };
            setLocation(userLocation);
            callback(userLocation);
          }
        );
      };

      startWatching();

      return () => {
        subscriber?.remove();
      };
    },
    [requestPermission]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestPermission().then((granted) => {
      if (!controller.signal.aborted) {
        setPermission(granted ? 'granted' : 'denied');
      }
    });
    return () => controller.abort();
  }, [requestPermission]);

  return {
    location,
    error,
    permission,
    requestPermission,
    getCurrentLocation,
    watchLocation,
  };
}