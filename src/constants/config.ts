// App Configuration Constants
export const CONFIG = {
  // API
  API_BASE_URL: 'https://transportesrober.com',
  GTFS_PATH: 'resources/gtfs',

  // Map
  MAP_DEFAULT_LAT: 37.1773,
  MAP_DEFAULT_LNG: -3.5986,
  MAP_DEFAULT_ZOOM: 14,
  MAP_MIN_ZOOM: 10,
  MAP_MAX_ZOOM: 19,

  // Notifications
  NOTIFICATION_THRESHOLD_MINUTES: 5,
  NOTIFICATION_CHECK_INTERVAL_MS: 30000, // 30 seconds

  // Tracking
  TRACKING_UPDATE_INTERVAL_MS: 10000, // 10 seconds
  /** Minimum gap between in-place refreshes of the persistent notification. */
  TRACKING_NOTIFICATION_INTERVAL_MS: 60000, // 1 minute
  TRACKING_MAX_DISTANCE_METERS: 5000, // 5km

  // Cache
  GTFS_CACHE_VERSION: '1.0.0',
  GTFS_CACHE_EXPIRY_DAYS: 30,

  // UI
  DEBOUNCE_SEARCH_MS: 300,
  ANIMATION_DURATION_MS: 300,

  // Storage Keys
  STORAGE_KEYS: {
    FAVORITES: 'favorites',
    TRACKING: 'tracking',
    SETTINGS: 'settings',
    GTFS_CACHE: 'gtfs_cache',
  },
} as const;

export type Config = typeof CONFIG;