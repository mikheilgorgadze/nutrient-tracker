/**
 * Streak badge — integration tests on ProgressScreen.
 *
 * Verifies the 🔥 Nd badge renders when streak > 0 and is absent when streak = 0.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressScreen } from '@/features/progress/screens/ProgressScreen';

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockStreak = 0;
let mockCalorieHistory: { date: string; kcal: number }[] = [];

jest.mock('@/features/progress/hooks/useStreak', () => ({
  useStreak: () => mockStreak,
}));

jest.mock('@/features/progress/hooks/useCalorieHistory', () => ({
  useCalorieHistory: () => ({ data: mockCalorieHistory, isLoading: false }),
  avgKcalExcludingZero: () => 0,
}));

jest.mock('@/features/progress/hooks/useWeightLog', () => ({
  useWeightLog: () => ({
    data: { entries: [], rawWeights: [], smoothedWeights: [], dates: [] },
    isLoading: false,
  }),
}));

jest.mock('@/features/progress/hooks/useTdeeEstimate', () => ({
  useTdeeEstimate: () => ({
    data: { estimatedTdee: 2000, confidence: null, latestRow: null },
    isLoading: false,
  }),
}));

jest.mock('@/features/progress/hooks/useWeightMutations', () => ({
  useWeightMutations: () => ({
    logWeight: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/progress/components/TdeeCard', () => ({
  TdeeCard: () => null,
}));

jest.mock('@/features/progress/components/WeightChart', () => ({
  WeightChart: () => null,
}));

jest.mock('@/features/progress/components/CalorieChart', () => ({
  CalorieChart: () => null,
}));

jest.mock('@/features/progress/components/WeightEntrySheet', () => ({
  WeightEntrySheet: () => null,
}));

jest.mock('@/hooks/useDb', () => ({
  useDb: () => ({}),
}));

jest.mock('@/lib/db/queries/goals', () => ({
  getGoals: () => null,
}));

jest.mock('@/lib/db', () => ({
  today: () => '2026-05-23',
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Streak badge in ProgressScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalorieHistory = [];
  });

  it('shows the streak badge when streak > 0', () => {
    mockStreak = 5;
    render(<ProgressScreen />, { wrapper });
    // Badge text is "🔥 5d" — just search for "5d"
    expect(screen.getByText(/5d/)).toBeTruthy();
  });

  it('hides the streak badge when streak is 0', () => {
    mockStreak = 0;
    render(<ProgressScreen />, { wrapper });
    expect(screen.queryByText(/🔥/)).toBeNull();
  });

  it('displays the correct streak number', () => {
    mockStreak = 12;
    render(<ProgressScreen />, { wrapper });
    expect(screen.getByText(/12d/)).toBeTruthy();
  });

  it('shows streak badge with accessibility label', () => {
    mockStreak = 3;
    render(<ProgressScreen />, { wrapper });
    expect(screen.getByLabelText('3 day streak')).toBeTruthy();
  });
});
