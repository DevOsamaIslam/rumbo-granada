import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Rumbo Granada',
  slug: 'rumbo-granada',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logo.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  scheme: 'rumbo-granada',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rumbo.granada.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app uses your location to show nearby bus stops and track buses in Rumbo Granada',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app uses your location to show nearby bus stops and track buses in Rumbo Granada in the background.',
      UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#E6F4FE',
    },
    package: 'com.rumbo.granada.app',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    '@maplibre/maplibre-react-native',
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/logo.png',
        color: '#6200EE',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow Rumbo Granada to access your location to show nearby bus stops and track buses.',
      },
    ],
    [
      'expo-localization',
      {
        supportedLocales: ['es', 'en'],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    gtfsPath: process.env.EXPO_PUBLIC_GTFS_PATH,
    mapDefaultLat: process.env.EXPO_PUBLIC_MAP_DEFAULT_LAT,
    mapDefaultLng: process.env.EXPO_PUBLIC_MAP_DEFAULT_LNG,
    mapDefaultZoom: process.env.EXPO_PUBLIC_MAP_DEFAULT_ZOOM,
    notificationThresholdMinutes: process.env.EXPO_PUBLIC_NOTIFICATION_THRESHOLD_MINUTES,
  },
});