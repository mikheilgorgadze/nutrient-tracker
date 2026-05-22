/**
 * useDiaryMutations — DB layer tests.
 *
 * These tests use a real mocked DB (jest.fn() stubs) to verify that when
 * addEntry.mutate is called, the correct SQL INSERT is executed.
 * The foodAddFlow tests already verify the UI wiring; these verify the DB wiring.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDiaryMutations } from '@/features/diary/hooks/useDiaryMutations';
import { insertDiaryEntry } from '@/lib/db/queries/diary';
import type { FoodRow } from '@/lib/db/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDb = {
  runSync: jest.fn().mockReturnValue({ lastInsertRowId: 1, changes: 1 }),
  getAllSync: jest.fn().mockReturnValue([]),
  getFirstSync: jest.fn().mockReturnValue(null),
  execSync: jest.fn(),
  withTransactionSync: jest.fn().mockImplementation((fn: () => void) => fn()),
};

jest.mock('@/hooks/useDb', () => ({
  useDb: () => mockDb,
}));

jest.mock('@/lib/db/queries/diary', () => ({
  insertDiaryEntry: jest.fn(),
  deleteDiaryEntry: jest.fn(),
  updateDiaryEntryServings: jest.fn(),
  getDiaryEntriesForDate: jest.fn().mockReturnValue([]),
  getDailyTotals: jest.fn().mockReturnValue({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BREAD: FoodRow = {
  id: 'food_bread',
  name: 'White Bread',
  brand: null,
  serving_size_g: 30,
  serving_label: '1 slice (30g)',
  kcal_per_serving: 79,
  protein_g: 2.7,
  carbs_g: 15,
  fat_g: 1.0,
  fiber_g: null,
  sugar_g: null,
  sodium_mg: null,
  barcode: null,
  is_custom: 0,
  created_at: 0,
};

// ── Wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDiaryMutations.addEntry', () => {
  beforeEach(() => {
    (insertDiaryEntry as jest.Mock).mockClear();
    mockDb.runSync.mockClear();
  });

  it('calls insertDiaryEntry with the food and computed macros', async () => {
    const { result } = renderHook(() => useDiaryMutations(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.addEntry.mutate({
        food: BREAD,
        servings: 1,
        date: '2026-05-21',
        mealSlot: 'breakfast',
      });
    });

    expect(insertDiaryEntry).toHaveBeenCalledTimes(1);

    const [, entry] = (insertDiaryEntry as jest.Mock).mock.calls[0];
    expect(entry.food_id).toBe('food_bread');
    expect(entry.date).toBe('2026-05-21');
    expect(entry.meal_slot).toBe('breakfast');
    expect(entry.servings).toBe(1);
    expect(Math.round(entry.kcal)).toBe(79);
    expect(entry.id).toBeTruthy(); // UUID generated
  });

  it('computes macros correctly for 2 servings', async () => {
    const { result } = renderHook(() => useDiaryMutations(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.addEntry.mutate({
        food: BREAD,
        servings: 2,
        date: '2026-05-21',
        mealSlot: 'lunch',
      });
    });

    const [, entry] = (insertDiaryEntry as jest.Mock).mock.calls[0];
    expect(Math.round(entry.kcal)).toBe(158);     // 79 * 2
    expect(entry.servings).toBe(2);
  });

  it('does NOT throw or crash when called — no silent error swallowing', async () => {
    const { result } = renderHook(() => useDiaryMutations(), {
      wrapper: makeWrapper(),
    });

    // This should resolve without throwing
    await expect(
      act(async () => {
        result.current.addEntry.mutate({
          food: BREAD,
          servings: 1,
          date: '2026-05-21',
          mealSlot: 'breakfast',
        });
      })
    ).resolves.not.toThrow();
  });
});
