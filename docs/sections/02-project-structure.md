# 02 — Project Structure

## Directory Layout

```
granabus/
├── app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx               # Root layout: providers, theme, global styles
│   ├── +not-found.tsx            # 404 screen
│   ├── (tabs)/                   # Tab group (bottom navigation)
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Home / Map screen
│   │   ├── lines.tsx             # Bus lines list
│   │   ├── favorites.tsx         # Favorites (buses + labeled stops)
│   │   └── settings.tsx          # Settings & notification prefs
│   ├── line/
│   │   └── [id].tsx              # Line detail: info, stops, map
│   └── stop/
│       └── [id].tsx              # Stop detail: arrivals, favorite, map
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── map/
│   │   │   ├── MapView.tsx       # Main map component
│   │   │   ├── StopMarker.tsx    # Stop marker with callout
│   │   │   ├── BusMarker.tsx     # Animated bus marker
│   │   │   ├── RoutePolyline.tsx # Route path overlay
│   │   │   └── MapControls.tsx   # Recenter, zoom, style toggle
│   │   ├── lines/
│   │   │   ├── LineList.tsx      # Searchable line list
│   │   │   ├── LineItem.tsx      # Line row with favorite button
│   │   │   └── LineDetail.tsx    # Line detail content
│   │   ├── stops/
│   │   │   ├── StopList.tsx      # Stop list for a line
│   │   │   ├── StopItem.tsx      # Stop row with arrival time
│   │   │   └── ArrivalsList.tsx  # Real-time arrivals
│   │   ├── favorites/
│   │   │   ├── FavoriteBusList.tsx
│   │   │   ├── FavoriteStopList.tsx
│   │   │   └── AddStopLabelModal.tsx
│   │   ├── tracking/
│   │   │   ├── TrackingCard.tsx  # Active tracking display
│   │   │   └── StartTrackingModal.tsx
│   │   ├── common/
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── ErrorView.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── SearchBar.tsx
│   │   └── index.ts              # Barrel exports
│   ├── hooks/                    # Custom React hooks
│   │   ├── useBusTracking.ts     # Core tracking logic
│   │   ├── useLines.ts           # Lines queries
│   │   ├── useStops.ts           # Stops queries
│   │   ├── useFavorites.ts       # Favorites actions
│   │   ├── useLocation.ts        # GPS location
│   │   └── index.ts
│   ├── services/                 # External integrations
│   │   ├── gtfs.ts               # GTFS parsing, indexing, queries
│   │   ├── liveApi.ts            # transportesrober.com scraping
│   │   ├── notifications.ts      # Notification scheduling
│   │   ├── storage.ts            # MMKV wrapper
│   │   └── index.ts
│   ├── store/                    # Zustand stores
│   │   ├── favorites.ts          # Favorite buses & labeled stops
│   │   ├── tracking.ts           # Active bus→stop tracking pairs
│   │   ├── settings.ts           # App settings (threshold, etc.)
│   │   └── index.ts
│   ├── utils/                    # Pure utility functions
│   │   ├── gtfs.ts               # GTFS helpers (parsing, shapes)
│   │   ├── map.ts                # Map utilities (clustering, distance)
│   │   ├── date.ts               # Time formatting, countdowns
│   │   ├── notifications.ts      # Notification helpers
│   │   └── index.ts
│   ├── types/                    # TypeScript type definitions
│   │   ├── gtfs.ts               # Route, Stop, Trip, StopTime, Shape
│   │   ├── favorites.ts          # FavoriteBus, FavoriteStop
│   │   ├── tracking.ts           # TrackedPair, TrackingState
│   │   ├── api.ts                # Live API response types
│   │   └── index.ts
│   ├── constants/                # App constants
│   │   ├── config.ts             # API URLs, thresholds, defaults
│   │   ├── colors.ts             # Paper theme colors
│   │   └── index.ts
│   └── index.ts                  # Main src barrel export
├── assets/
│   ├── images/                   # Static images, icons
│   ├── fonts/                    # Custom fonts (if any)
│   └── map-styles/               # Map style JSON (future)
├── resources/                    # Static data (committed)
│   └── gtfs/                     # GTFS CSV files
├── docs/                         # Documentation
│   ├── detailed-plan.md
│   ├── progress-tracker.md
│   ├── phases/                   # Phase implementation docs
│   └── sections/                 # Architecture reference
├── .agents/                      # Agent workflow
│   └── skills/
│       └── workflow-rules.md
├── .github/
│   └── workflows/                # CI/CD (future)
├── .env.example                  # Environment template
├── app.config.ts                 # Expo config
├── eas.json                      # EAS Build config
├── metro.config.js               # Metro bundler config
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── prettier.config.js
└── README.md
```
## Barrel Exports

Each directory has an `index.ts` for clean imports:

```ts
// src/components/index.ts
export * from './map';
export * from './lines';
export * from './stops';
export * from './favorites';
export * from './tracking';
export * from './common';

// src/hooks/index.ts
export * from './useBusTracking';
export * from './useLines';
export * from './useStops';
export * from './useFavorites';
export * from './useLocation';
```

## Path Aliases

Configured in `tsconfig.json` and `metro.config.js`:

| Alias | Resolves To |
|-------|-------------|
| `@/*` | `src/*` |
| `~/` | `src/*` |

Usage: `import { useFavoritesStore } from '@/store/favorites'`

## File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Screens (Expo Router) | kebab-case | `lines.tsx`, `stop/[id].tsx` |
| Components | PascalCase | `StopMarker.tsx` |
| Hooks | camelCase + `use` | `useBusTracking.ts` |
| Stores/Services/Utils | camelCase | `favorites.ts`, `liveApi.ts` |
| Types | PascalCase | `gtfs.ts` (file), `Route` (type) |
| Constants | camelCase | `config.ts` |
| Tests | `.test.tsx` / `.spec.ts` | `gtfs.test.ts` |

## Component Structure

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.styles.ts # StyleSheet (if complex)
├── ComponentName.test.tsx  # Unit tests
└── index.ts                # Barrel export
```

For simple components, single file is fine.

## Environment-Specific Files

- `.env` — local overrides (gitignored)
- `.env.example` — template for required vars
- `app.config.ts` — reads `process.env` for Expo config
```