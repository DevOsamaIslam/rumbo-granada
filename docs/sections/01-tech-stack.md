# 01 — Tech Stack & Conventions

## Language & Runtime
- **TypeScript 5.5+** — strict mode enabled
- **React Native 0.76+** (via Expo SDK 51+)
- **Hermes** — default JS engine

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~51.0 | App framework |
| `expo-router` | ~4.0 | File-based navigation |
| `react-native-paper` | ^5.12 | Material Design 3 components |
| `react-native-maps` | ^1.18 | Map view |
| `@tanstack/react-query` | ^5.0 | Server state, caching |
| `zustand` | ^4.5 | Client state (favorites, tracking) |
| `react-native-mmkv` | ^3.0 | Fast synchronous storage |
| `expo-notifications` | ~0.28 | Local & push notifications |
| `expo-task-manager` | ~11.8 | Background tasks |
| `expo-background-fetch` | ~11.8 | Background fetch |
| `expo-location` | ~17.0 | GPS, geofencing |
| `expo-haptics` | ~13.0 | Haptic feedback |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| `vitest` | Unit testing |
| `@testing-library/react-native` | Component testing |
| `jest-expo` | Expo test preset |
| `eslint` | Linting |
| `@typescript-eslint/parser` | TS parsing |
| `eslint-config-airbnb` | Airbnb style |
| `eslint-config-prettier` | Prettier integration |
| `prettier` | Formatting |
| `husky` | Git hooks |
| `lint-staged` | Pre-commit linting |

## TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "~/": ["src/*"]
    },
    "types": ["jest-expo", "vitest/globals"]
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts"],
  "exclude": ["node_modules", "dist", ".expo"]
}
```

## ESLint Config (`eslint.config.js`)

- Extends: `airbnb`, `airbnb-typescript`, `prettier`
- Plugins: `react`, `react-native`, `react-hooks`, `@typescript-eslint`
- Rules: `react/react-in-jsx-scope: off`, `react-native/no-unused-styles: warn`

## Prettier Config (`prettier.config.js`)

```js
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  plugins: ['prettier-plugin-packagejson'],
};
```

## Git Hooks (Husky)

- `pre-commit`: `lint-staged` → ESLint + Prettier on staged files
- `pre-push`: `npm run typecheck && npm run test`

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StopMarker.tsx` |
| Hooks | camelCase + `use` | `useBusTracking.ts` |
| Stores | camelCase + `Store` | `favoritesStore.ts` |
| Services | PascalCase + `Service` | `LiveApiService.ts` |
| Types | PascalCase | `Route`, `Stop`, `TrackedPair` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_ARRIVAL_THRESHOLD_METERS` |
| Files | kebab-case (non-component) | `gtfs-parser.ts` |

## Import Order

1. React / React Native / Expo
2. Third-party libraries
3. Internal (`@/` or `~/` aliases)
4. Relative imports
5. Types (separated by blank line)

```ts
import React from 'react';
import { View, Text } from 'react-native';
import { MapView } from 'react-native-maps';

import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

import { useFavoritesStore } from '@/store/favorites';
import { LiveApiService } from '@/services/liveApi';

import type { Route, Stop } from '@/types/gtfs';
import { stopUtils } from '@/utils/gtfs';
```