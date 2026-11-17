import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Rumbo Granada',
  slug: 'rumbo-granada',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  scheme: 'rumbo-granada',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rumbo.granada.app',
    // Seeds the remote build number the first time EAS Build reads it; from
    // then on `autoIncrement` in eas.json owns this value.
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app uses your location to show nearby bus stops and track buses in Rumbo Granada',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app uses your location to show nearby bus stops and track buses in Rumbo Granada in the background.',
      UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
      // The app only performs standard HTTPS requests (no custom crypto), so it
      // is exempt from the US export-compliance documentation requirement.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#95071A',
    },
    package: 'com.rumbo.granada.app',
    // Seeds the remote versionCode (see `ios.buildNumber`).
    versionCode: 1,
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
      'expo-splash-screen',
      {
        // 1024x1024 transparent PNG: Expo centres it on the brand red and scales
        // it with `imageWidth` (see assets/splash-icon.png).
        image: './assets/splash-icon.png',
        imageWidth: 220,
        resizeMode: 'contain',
        backgroundColor: '#AE0420',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#AE0420',
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
        // es/en/ar are the locales shipped in `locales/` (Phase 15).
        supportedLocales: ['es', 'en', 'ar'],
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