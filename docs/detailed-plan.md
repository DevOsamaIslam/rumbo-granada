# Granabus — Detailed Architecture Plan

This document indexes all architecture sections and serves as a quick reference for the codebase.

## Architecture Sections

| # | Section | File | Description |
|---|---------|------|-------------|
| 1 | [Tech Stack & Conventions](./sections/01-tech-stack.md) | Language, frameworks, linting, formatting, Git hooks |
| 2 | [Project Structure](./sections/02-project-structure.md) | Directory layout, naming conventions, barrel exports |
| 3 | [Navigation & Routing](./sections/03-navigation.md) | Expo Router setup, tab layout, deep linking |
| 4 | [State Management](./sections/04-state-management.md) | Zustand stores, React Query cache, persistence |
| 5 | [UI System](./sections/05-ui-system.md) | React Native Paper theme, components, dark mode |
| 6 | [Map Integration](./sections/06-map-integration.md) | react-native-maps, OSM tiles, custom markers, clustering |
| 7 | [GTFS Data Layer](./sections/07-gtfs-data.md) | Parsing, indexing, querying static GTFS data |
| 8 | [Live API Integration](./sections/08-live-api.md) | transportesrober.com scraping, real-time positions |
| 9 | [Favorites System](./sections/09-favorites.md) | Favorite buses, labeled stops, MMKV persistence |
| 10 | [Notifications](./sections/10-notifications.md) | Expo Notifications, background fetch, trigger logic |
| 11 | [Background Tasks](./sections/11-background-tasks.md) | Task Manager, background fetch, battery optimization |
| 12 | [Testing Strategy](./sections/12-testing.md) | Vitest, RNTL, integration tests, E2E with Maestro |
| 13 | [Performance & Bundle](./sections/13-performance.md) | Hermes, bundle splitting, image optimization |
| 14 | [Build & Release](./sections/14-build-release.md) | EAS Build, app store config, OTA updates |

## Quick Reference

### Key Files

```
app/_layout.tsx              → Root layout, providers, theme
app/(tabs)/_layout.tsx       → Tab navigator config
src/store/favorites.ts       → Favorites Zustand store
src/services/gtfs.ts         → GTFS parsing & queries
src/services/liveApi.ts      → Real-time API client
src/services/notifications.ts → Notification scheduling
src/hooks/useBusTracking.ts  → Bus tracking logic
src/components/MapView.tsx   → Main map component
src/components/StopMarker.tsx → Custom stop markers
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_GTFS_PATH` | Path to GTFS resources | Yes (dev) |
| `EXPO_PUBLIC_API_BASE` | Live API base URL | Yes |
| `EXPO_PUBLIC_OSM_TILE_URL` | OSM tile server template | No (default) |
| `EXPO_PUBLIC_ONESIGNAL_APP_ID` | Push notifications (prod) | No |

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint + Prettier check |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage with thresholds |
| `npm run build:ios` | EAS Build iOS |
| `npm run build:android` | EAS Build Android |

## Milestones

### Milestone 1: MVP (Phases 1–12)

| Phase | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 1 | Project Scaffolding | ✅ | — |
| 2 | Navigation & Tab Shell | ✅ | 1 |
| 3 | GTFS Data Layer | ✅ | 1 |
| 4 | Map View with OSM | ⬜ | 2, 3 |
| 5 | Bus Lines List & Detail | ⬜ | 3, 4 |
| 6 | Stop Detail & Arrivals | ⬜ | 3, 5 |
| 7 | Favorites: Buses | ⬜ | 4, 5 |
| 8 | Favorites: Stops with Labels | ⬜ | 4, 6 |
| 9 | Live API Integration | ⬜ | 3 |
| 10 | Bus Tracking & Notifications | ⬜ | 9 |
| 11 | Background Fetch & Persistence | ⬜ | 10 |
| 12 | Polish, Testing, Build Config | ⬜ | 1–11 |

### Milestone 2: Enhancements (Phases 13–18)

| Phase | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 13 | Push Notifications (OneSignal/Expo) | ⬜ | 10, 11 |
| 14 | Offline Support & Caching | ⬜ | 3, 11 |
| 15 | Search & Filter | ⬜ | 5, 6 |
| 16 | Accessibility & i18n (ES/EN) | ⬜ | 1–12 |
| 17 | Performance Optimization | ⬜ | 1–12 |
| 18 | App Store Release Prep | ⬜ | 13–17 |

---

*Generated from [`docs/progress-tracker.md`](./progress-tracker.md)*