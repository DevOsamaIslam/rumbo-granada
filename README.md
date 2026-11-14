# Rumbo Granada

A React Native mobile app for Granada bus tracking using OpenStreetMap. Built with React Native Paper (Material Design 3) and GTFS data.

## Features

- **Bus Lines & Stops** — Browse all Granada bus lines (from GTFS) with their stops on an interactive OpenStreetMap
- **Favorite Buses** — Star your frequently used bus lines for quick access
- **Favorite Stops with Labels** — Save stops with custom labels (e.g., "Home", "Work", "Gym")
- **Live Notifications** — Get push notifications when your selected bus reaches your selected stop
- **Real-time Tracking** — Track bus positions in real-time using the transportesrober.com API

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo (SDK 51+) |
| UI Library | React Native Paper (Material Design 3) |
| Maps | react-native-maps + OpenStreetMap tiles |
| Navigation | Expo Router (file-based) |
| State | Zustand + React Query (TanStack Query) |
| Local Storage | MMKV (fast, synchronous) |
| Notifications | Expo Notifications (local + push) |
| Background Tasks | Expo Task Manager + Background Fetch |
| Language | TypeScript (strict) |
| Testing | Vitest + React Native Testing Library |
| Lint/Format | ESLint (Airbnb) + Prettier |

## Project Structure

```
rumbo-granada/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home / Map
│   │   ├── lines.tsx      # Bus lines list
│   │   ├── favorites.tsx  # Favorites (buses + stops)
│   │   └── settings.tsx   # Settings & notifications
│   ├── line/[id].tsx      # Line detail with stops
│   ├── stop/[id].tsx      # Stop detail with arrivals
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API, GTFS, notifications
│   ├── store/             # Zustand stores
│   ├── utils/             # Helpers (gtfs, map, dates)
│   ├── types/             # TypeScript types
│   └── constants/         # App constants
├── assets/                # Images, fonts, map styles
├── docs/                  # Documentation
│   ├── phases/            # Phase-by-phase implementation docs
│   └── sections/          # Architecture reference sections
└── .agents/               # Agent workflow config
```

## Data Sources

- **GTFS Static** — `resources/gtfs/` (routes, stops, trips, stop_times, shapes)
- **Live API** — `transportesrober.com/flotamovimiento/` (real-time bus positions)
  - Line stops: `linea_paradas.php?ln={line}`
  - Stop arrivals: `paradas.htm` (form with stop number)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Type checking
npm run typecheck

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint
```

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/detailed-plan.md`](./docs/detailed-plan.md) | Architecture index + quick reference |
| [`docs/sections/`](./docs/sections) | Architecture sections (stack, data, map, notifications, etc.) |
| [`docs/phases/`](./docs/phases) | Milestone 1 (MVP, phases 1–12), Milestone 2 (Polish, phases 13–18) task lists |
| [`docs/progress-tracker.md`](./docs/progress-tracker.md) | Phase status and dependencies |

## Agent Workflow

AI/agent contributors must follow the workflow rules:
1. Look up the next incomplete task in [`docs/progress-tracker.md`](./docs/progress-tracker.md)
2. Propose a plan
3. Wait for confirmation
4. Implement, test, and update the docs

See [`.agents/skills/workflow-rules.md`](./.agents/skills/workflow-rules.md) for details.

## License

MIT