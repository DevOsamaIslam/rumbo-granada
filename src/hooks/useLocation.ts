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
      let cancelled = false;

      const startWatching = async () => {
        try {
          const hasPermission = await requestPermission();
          if (!hasPermission || cancelled) return;

          const nextSubscriber = await Location.watchPositionAsync(
            {
              // Balanced, not High: high-accuracy requests make Google Play
              // services prompt the user to enable "Location accuracy" on every
              // launch. Balanced still yields a fix for the map's follow mode.
              accuracy: Location.Accuracy.Balanced,
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

          // The caller may have unmounted while the subscription was resolving.
          if (cancelled) {
            nextSubscriber.remove();
            return;
          }
          subscriber = nextSubscriber;
        } catch {
          // Location can fail when the device has location services disabled or
          // its settings unsatisfied. Stay silent: the map works without a fix.
        }
      };

      void startWatching();

      return () => {
        cancelled = true;
        subscriber?.remove();
      };
    },
    [requestPermission]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestPermission()
      .then((granted) => {
        if (!controller.signal.aborted) {
          setPermission(granted ? 'granted' : 'denied');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPermission('denied');
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