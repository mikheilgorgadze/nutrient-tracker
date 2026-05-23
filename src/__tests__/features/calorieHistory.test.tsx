/**
 * useCalorieHistory hook + avgKcalExcludingZero utility tests.
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalorieHistory, avgKcalExcludingZero } from '@/features/progress/hooks/useCalorieHistory';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetDiaryKcalByDate = jest.fn();

jest.mock('@/lib/db/queries/progress', () => ({
  ...jest.requireActual('@/lib/db/queries/progress'),
  getDiaryKcalByDate: (...args: any[]) => mockGetDiaryKcalByDate(...args),
}));

jest.mock('@/hooks/useDb', () => ({
  useDb: () => ({
    /* minimal mock — just needs to be non-null to enable the query */
  }),
}));

// ── Helper ─────────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

/** Returns today minus `n` days as 'YYYY-MM-DD'. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── useCalorieHistory tests ───────────────────────────────────────────────────

describe('useCalorieHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns exactly `days` entries', async () => {
    mockGetDiaryKcalByDate.mockReturnValue([
      { date: daysAgo(0), kcal: 1800 },
    ]);

    const { result } = renderHook(() => useCalorieHistory(7), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data.length).toBe(7);
    });
  });

  it('fills missing dates with kcal=0', async () => {
    // Only today has data; the other 6 days should be 0
    mockGetDiaryKcalByDate.mockReturnValue([
      { date: daysAgo(0), kcal: 1800 },
    ]);

    const { result } = renderHook(() => useCalorieHistory(7), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      const zeros = result.current.data.filter(e => e.kcal === 0);
      expect(zeros.length).toBe(6);
    });
  });

  it('orders results oldest first', async () => {
    mockGetDiaryKcalByDate.mockReturnValue([
      { date: daysAgo(2), kcal: 1500 },
      { date: daysAgo(0), kcal: 1800 },
    ]);

    const { result } = renderHook(() => useCalorieHistory(7), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      const data = result.current.data;
      // Ensure each entry's date is >= the previous entry's date (oldest first)
      for (let i = 1; i < data.length; i++) {
        expect(data[i].date >= data[i - 1].date).toBe(true);
      }
    });
  });

  it('preserves kcal values from DB for dates that have data', async () => {
    mockGetDiaryKcalByDate.mockReturnValue([
      { date: daysAgo(1), kcal: 2100 },
      { date: daysAgo(0), kcal: 1900 },
    ]);

    const { result } = renderHook(() => useCalorieHistory(7), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      const data = result.current.data;
      const withKcal = data.filter(e => e.kcal > 0);
      expect(withKcal.length).toBe(2);
      expect(withKcal.map(e => e.kcal).sort()).toEqual([1900, 2100]);
    });
  });
});

// ── avgKcalExcludingZero tests ────────────────────────────────────────────────

describe('avgKcalExcludingZero', () => {
  it('returns 0 for an empty array', () => {
    expect(avgKcalExcludingZero([])).toBe(0);
  });

  it('returns 0 when all days have 0 kcal', () => {
    const entries = [
      { date: '2026-05-17', kcal: 0 },
      { date: '2026-05-18', kcal: 0 },
    ];
    expect(avgKcalExcludingZero(entries)).toBe(0);
  });

  it('excludes 0-kcal days from the average', () => {
    const entries = [
      { date: '2026-05-17', kcal: 0 },
      { date: '2026-05-18', kcal: 0 },
      { date: '2026-05-19', kcal: 0 },
      { date: '2026-05-20', kcal: 0 },
      { date: '2026-05-21', kcal: 0 },
      { date: '2026-05-22', kcal: 1800 },
      { date: '2026-05-23', kcal: 2200 },
    ];
    // Only 2 days have data; avg = (1800 + 2200) / 2 = 2000
    expect(avgKcalExcludingZero(entries)).toBe(2000);
  });

  it('computes average correctly when all days have data', () => {
    const entries = [
      { date: '2026-05-17', kcal: 1800 },
      { date: '2026-05-18', kcal: 2000 },
      { date: '2026-05-19', kcal: 2200 },
    ];
    // avg = (1800 + 2000 + 2200) / 3 = 2000
    expect(avgKcalExcludingZero(entries)).toBe(2000);
  });

  it('rounds to the nearest integer', () => {
    const entries = [
      { date: '2026-05-22', kcal: 1000 },
      { date: '2026-05-23', kcal: 1001 },
    ];
    // avg = 1000.5 → rounds to 1001
    expect(avgKcalExcludingZero(entries)).toBe(1001);
  });

  it('average excludes 0-kcal days regardless of count (fewer than 3 data days)', () => {
    // Only 1 out of 7 days has data; should still return that one day's value
    const entries = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-05-${String(17 + i).padStart(2, '0')}`,
      kcal: i === 6 ? 1840 : 0,
    }));
    expect(avgKcalExcludingZero(entries)).toBe(1840);
  });
});
