/**
 * useFoodMutations — DB layer tests.
 *
 * Verifies that createFood.mutate calls insertFood with the correct payload,
 * sets is_custom=1, and generates a valid UUID for the new food's id.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFoodMutations } from '@/features/foods/hooks/useFoodMutations';
import { insertFood } from '@/lib/db/queries/foods';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDb = {
  runSync: jest.fn().mockReturnValue({ lastInsertRowId: 1, changes: 1 }),
  getAllSync: jest.fn().mockReturnValue([]),
  getFirstSync: jest.fn().mockReturnValue(null),
  execSync: jest.fn(),
  withTransactionSync: jest.fn().mockImplementation((fn: () => void) => fn()),
};

jest.mock('@/hooks/useDb', () => ({ useDb: () => mockDb }));

jest.mock('@/lib/db/queries/foods', () => ({
  insertFood: jest.fn(),
  searchFoods: jest.fn().mockReturnValue([]),
  getFoodById: jest.fn().mockReturnValue(null),
  seedFoods: jest.fn(),
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CUSTOM_FOOD_INPUT = {
  name: 'Homemade Granola',
  brand: 'Home',
  serving_label: '1 cup',
  serving_size_g: 60,
  kcal_per_serving: 280,
  protein_g: 6,
  carbs_g: 42,
  fat_g: 10,
  fiber_g: null,
  sugar_g: null,
  sodium_mg: null,
  barcode: null,
  is_custom: 1 as const,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFoodMutations.createFood', () => {
  beforeEach(() => {
    (insertFood as jest.Mock).mockClear();
  });

  it('calls insertFood with is_custom=1 and a generated UUID', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.createFood.mutate(CUSTOM_FOOD_INPUT);
    });

    expect(insertFood).toHaveBeenCalledTimes(1);
    const [, food] = (insertFood as jest.Mock).mock.calls[0];
    expect(food.is_custom).toBe(1);
    expect(food.id).toMatch(UUID_RE);
  });

  it('passes name, brand, and serving fields through unchanged', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.createFood.mutate(CUSTOM_FOOD_INPUT);
    });

    const [, food] = (insertFood as jest.Mock).mock.calls[0];
    expect(food.name).toBe('Homemade Granola');
    expect(food.brand).toBe('Home');
    expect(food.serving_label).toBe('1 cup');
    expect(food.serving_size_g).toBe(60);
  });

  it('passes macro values through unchanged', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.createFood.mutate(CUSTOM_FOOD_INPUT);
    });

    const [, food] = (insertFood as jest.Mock).mock.calls[0];
    expect(food.kcal_per_serving).toBe(280);
    expect(food.protein_g).toBe(6);
    expect(food.carbs_g).toBe(42);
    expect(food.fat_g).toBe(10);
  });

  it('resolves with the food object including the generated id', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    let resolved: unknown;
    await act(async () => {
      result.current.createFood.mutate(CUSTOM_FOOD_INPUT, {
        onSuccess: (food) => { resolved = food; },
      });
    });

    expect((resolved as { id: string }).id).toMatch(UUID_RE);
    expect((resolved as { name: string }).name).toBe('Homemade Granola');
  });

  it('does not throw when called with valid input', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    await expect(
      act(async () => { result.current.createFood.mutate(CUSTOM_FOOD_INPUT); })
    ).resolves.not.toThrow();
  });
});
