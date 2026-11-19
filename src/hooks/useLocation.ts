// Location Hook
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
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

  /**
   * Whether the device-level location switch is on. A granted permission is not
   * enough: the user can turn location off at any time while the app keeps its
   * permission, and then every fix silently fails.
   */
  const hasServicesEnabled = useCallback(async () => {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  }, []);

  /**
   * Gate for anything that needs a position fix (e.g. the map's follow button).
   * Resolves `false` when location services are off or the permission is
   * denied, so the caller can ask the user to turn location on.
   */
  const ensureLocationReady = useCallback(async () => {
    if (!(await hasServicesEnabled())) return false;
    return requestPermission();
  }, [hasServicesEnabled, requestPermission]);

  /**
   * Opens the prompt/screen where location can be turned on. Android shows the
   * system "turn on location" dialog; other platforms open the app's settings
   * page. Resolves `true` once location is on (e.g. the user accepted the
   * dialog). A dismissed Android dialog resolves `false` without opening
   * anything else — the next press asks again.
   */
  const openLocationSettings = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
        return await hasServicesEnabled();
      } catch {
        // The user dismissed the system dialog; do not nag them with settings.
        return false;
      }
    }
    try {
      await Linking.openSettings();
    } catch {
      // Settings are unavailable (e.g. web); there is nothing else to offer.
    }
    return hasServicesEnabled();
  }, [hasServicesEnabled]);

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
    hasServicesEnabled,
    ensureLocationReady,
    openLocationSettings,
  };
}