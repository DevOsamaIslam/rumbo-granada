# Rumbo Granada — Agent Workflow Rules

## Overview

This document defines the workflow for AI/agent contributors working on the Rumbo Granada project. Follow these rules for all contributions.

## Workflow Process

### 1. Check Progress Tracker
- Read [`docs/progress-tracker.md`](../docs/progress-tracker.md)
- Find the first incomplete task (⬜) in the earliest incomplete phase
- Verify all dependencies are complete (✅)

### 2. Propose a Plan
- Create a detailed implementation plan for the task
- Include: files to create/modify, tests to add, acceptance criteria
- Present plan to user for confirmation before implementing

### 3. Implement
- Write code following the architecture documented in [`docs/sections/`](../docs/sections/)
- Follow TypeScript strict mode, ESLint, Prettier
- Add unit tests for new functionality
- Update relevant documentation

### 4. Test
- Run `npm run test` for unit tests
- Run `npm run typecheck` for TypeScript validation
- Run `npm run lint` for code quality
- Verify manually on device/simulator if UI changes

### 5. Update Documentation
- Mark task as complete (✅) in `docs/progress-tracker.md`
- Update any architecture docs if patterns changed
- Add new section docs if new patterns introduced

## Code Standards

### TypeScript
- Strict mode enabled (`noUncheckedIndexedAccess: true`)
- Use path aliases: `@/` or `~/` for `src/`
- Explicit return types for public functions
- Discriminated unions for state types

### React Native
- Functional components with hooks
- `React.memo` for list items and markers
- Platform-specific code in separate files (`.ios.ts`, `.android.ts`)
- Accessibility props on all interactive elements

### State Management
- Server state → React Query (TanStack Query)
- Client state → Zustand + MMKV persistence
- Derived state → computed in selectors, not stored

### Testing
- Unit tests for all services, stores, hooks, utilities
- Component tests for complex UI (markers, modals, lists)
- Mock external dependencies (API, native modules)
- Coverage thresholds: lines 80%, functions 80%, branches 70%

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- One logical change per commit
- Pre-commit hooks: ESLint + Prettier on staged files
- Pre-push: typecheck + test

## Architecture References

Always consult these before implementing:

| Document | Purpose |
|----------|---------|
| `docs/sections/01-tech-stack.md` | Language, frameworks, conventions |
| `docs/sections/02-project-structure.md` | Directory layout, naming |
| `docs/sections/03-navigation.md` | Expo Router, deep linking |
| `docs/sections/04-state-management.md` | React Query, Zustand, MMKV |
| `docs/sections/05-ui-system.md` | Paper theme, components |
| `docs/sections/06-map-integration.md` | react-native-maps, OSM, markers |
| `docs/sections/07-gtfs-data.md` | GTFS parsing, indexing, queries |
| `docs/sections/08-live-api.md` | transportesrober.com scraping |
| `docs/sections/09-favorites.md` | Favorite buses, labeled stops |
| `docs/sections/10-notifications.md` | Local notifications, tracking |
| `docs/sections/11-background-tasks.md` | Background fetch, battery |
| `docs/sections/12-testing.md` | Vitest, RNTL, Maestro |
| `docs/sections/13-performance.md` | Bundle, map, memory |
| `docs/sections/14-build-release.md` | EAS Build, app config |

## Task Completion Checklist

Before marking a task complete:

- [ ] Code implements all acceptance criteria
- [ ] Unit tests added and passing
- [ ] TypeScript compiles without errors
- [ ] ESLint/Prettier pass
- [ ] Manual verification on device/simulator
- [ ] Documentation updated
- [ ] Progress tracker updated

## Questions?

If unclear about any requirement:
1. Check architecture docs first
2. Check progress tracker for context
3. Ask user for clarification
4. Document decision in relevant section doc