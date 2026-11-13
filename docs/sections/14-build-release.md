# 14 — Build & Release

## EAS Build Configuration (`eas.json`)

```json
{
  "cli": { "version": ">= 5.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "gradleCommand": ":app:assembleDebug" },
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "enterpriseProvisioning": "ad-hoc" }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": { "enterpriseProvisioning": "app-store" }
    }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./google-play-key.json", "track": "internal" },
      "ios": { "appleId": "your@email.com", "ascAppId": "1234567890" }
    }
  }
}
```

## App Config (`app.config.ts`)

```ts
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Granabus',
  slug: 'granabus',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'granabus',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1976D2',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.granabus.app',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Show your location on the map',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Track buses in background',
      UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#1976D2',
    },
    package: 'com.granabus.app',
    versionCode: 1,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'RECEIVE_BOOT_COMPLETED',
      'WAKE_LOCK',
      'FOREGROUND_SERVICE',
      'POST_NOTIFICATIONS',
    ],
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    'expo-task-manager',
    ['expo-background-fetch', { minimumInterval: 15 }],
    ['expo-location', { locationAlwaysAndWhenInUsePermission: 'Allow Granabus to track buses in background' }],
  ],
  extra: {
    eas: { projectId: 'your-project-id' },
  },
});
```

## Build Commands

```bash
# Development build
eas build --profile development --platform all

# Preview (internal testing)
eas build --profile preview --platform all

# Production
eas build --profile production --platform all

# Submit to stores
eas submit --platform all
```

## OTA Updates (`expo-updates`)

```ts
// app.config.ts additions
updates: {
  url: 'https://u.expo.dev/your-project-id',
  fallbackToCacheTimeout: 30000,
  checkAutomatically: 'ON_LOAD',
  enabled: true,
},
runtimeVersion: { policy: 'appVersion' },
```

## Version Management

```bash
# Bump version
npm version patch|minor|major
# Updates package.json, creates git tag

# Build with new version
eas build --profile production --auto-submit
```

## Required Assets

| Asset | Size | Format |
|-------|------|--------|
| Icon | 1024x1024 | PNG |
| Adaptive Icon (Android) | 1024x1024 | PNG |
| Splash Screen | 2732x2732 | PNG |
| iOS App Store | 1024x1024 | PNG (no transparency) |
| Play Store Feature | 1024x500 | PNG |
| Play Store Banner | 1440x720 | PNG |

## Permissions Summary

| Permission | iOS | Android | Purpose |
|------------|-----|---------|---------|
| Location (always) | ✅ | ✅ | Background bus tracking |
| Location (when in use) | ✅ | ✅ | Map user location |
| Notifications | ✅ | ✅ | Arrival alerts |
| Background Fetch | ✅ | ✅ | Periodic tracking checks |
| Boot Complete | ❌ | ✅ | Restart tracking on reboot |
| Wake Lock | ❌ | ✅ | Keep CPU awake for tracking |