# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NutrientTracker** — a MacroFactor-inspired mobile app for tracking nutrition. Fully offline, all calculations on-device. React Native (iOS + Android), SQLite for persistence, AI-assisted food photo analysis.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (Expo) |
| Language | TypeScript |
| Local DB | expo-sqlite (SQLite) |
| State / data | Zustand + React Query (offline-first) |
| Navigation | Expo Router (file-based) |
| Food photo AI | Claude API (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk` |
| Testing | Jest + React Native Testing Library |
| Linting | ESLint + Prettier |

---

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server (Expo Go)
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Type check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Run all tests
npx jest

# Run a single test file
npx jest src/path/to/file.test.ts

# Run tests matching a pattern
npx jest --testNamePattern "TDEE"

# EAS build (production)
npx eas build --platform all
```

---

## Architecture

### Directory Layout (planned)

```
src/
  app/               # Expo Router screens (file-based routing)
  components/        # Reusable UI components
  features/          # Feature slices (each has its own logic, hooks, components)
    diary/           # Food diary — log entries, daily totals
    foods/           # Food database, search, custom foods
    goals/           # Macro/calorie goal management
    progress/        # Weight tracking, trend charts
    camera/          # Photo-to-nutrition estimation
  lib/
    db/              # SQLite schema, migrations, query helpers
    algorithms/      # TDEE, adaptive calorie, macro targets (pure functions)
    ai/              # Claude API integration for food photo analysis
  store/             # Zustand stores (UI state)
  hooks/             # Shared React hooks
```

### SQLite / Data Layer

- All DB access goes through `src/lib/db/`. Raw SQL via `expo-sqlite`; no ORM.
- Schema migrations are numbered files in `src/lib/db/migrations/`.
- The DB is initialized once at app launch; the store hydrates from it.

### Nutrition Algorithms (`src/lib/algorithms/`)

MacroFactor-style adaptive approach:
- **TDEE estimation**: Mifflin-St Jeor BMR × activity multiplier as baseline; then a rolling weighted regression over (weight, calories logged) history adjusts the estimate each week.
- **Adaptive calorie target**: offset from current TDEE based on the user's selected goal (cut / maintain / bulk) and rate of change.
- **Macro split**: protein (g/kg body weight), fat (floor %), carbs fill the remainder.
- All algorithm functions are pure (no side effects) and must be unit-tested independently of the UI.

### Food Photo Estimation (`src/lib/ai/`)

- Uses the Claude API (`claude-haiku-4-5-20251001`) with vision input.
- The app encodes the photo as base64 and sends it alongside a structured prompt requesting JSON output: `{ items: [{ name, weight_g, calories, protein_g, carbs_g, fat_g }] }`.
- Results are shown as **estimates** and always editable before logging.
- The Anthropic API key is stored in `~/.env.local` (never committed). Load via `expo-constants` / `react-native-dotenv`.
- Prompt caching is enabled for the system prompt to reduce latency/cost on repeat calls.

### State Management

- Zustand for synchronous in-memory state (active diary day, UI preferences).
- React Query for async reads from SQLite (treats the DB like a server — cache, invalidate on mutation).
- No Redux. No Context for data (only for theme / auth).

---

## Key Constraints

- **Fully offline**: no backend, no user accounts, no sync. All data stays on-device.
- The Claude API call for photo analysis is the **only** network request the app ever makes.
- Expo managed workflow for as long as possible; eject only if a native module forces it.
- Target iOS 16+ and Android 13+ (API level 33+).
