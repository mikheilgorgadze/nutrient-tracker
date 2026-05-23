/**
 * Recent foods feature — FoodSearchModal integration tests.
 *
 * Verifies that when the search term is empty and recent foods exist,
 * the "Recent" section header and food names are shown. When 2+ chars are
 * typed, regular search results appear instead. When no recent foods exist
 * and the term is empty, nothing is shown.
 */
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FoodSearchModal } from '@/features/foods/components/FoodSearchModal';
import type { FoodRow } from '@/lib/db/types';

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

const CHICKEN: FoodRow = {
  id: 'food_chicken',
  name: 'Chicken Breast',
  brand: null,
  serving_size_g: 100,
  serving_label: '100g',
  kcal_per_serving: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
  fiber_g: null,
  sugar_g: null,
  sodium_mg: null,
  barcode: null,
  is_custom: 0,
  created_at: 0,
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseFoodSearch = jest.fn((term: string) => ({
  results: term.length >= 2 ? [CHICKEN] : [],
  isLoading: false,
}));

const mockUseRecentFoods = jest.fn(() => ({ data: [BREAD] }));

jest.mock('@/features/foods/hooks/useFoodSearch', () => ({
  useFoodSearch: (term: string) => mockUseFoodSearch(term),
}));

jest.mock('@/features/foods/hooks/useRecentFoods', () => ({
  useRecentFoods: () => mockUseRecentFoods(),
}));

jest.mock('@/features/diary/hooks/useDiaryMutations', () => ({
  useDiaryMutations: () => ({
    addEntry: { mutate: jest.fn(), isPending: false },
    removeEntry: { mutate: jest.fn(), isPending: false },
    updateServings: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/foods/hooks/useFoodMutations', () => ({
  useFoodMutations: () => ({
    createFood: { mutate: jest.fn(), isPending: false },
  }),
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Recent foods in FoodSearchModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFoodSearch.mockImplementation((term: string) => ({
      results: term.length >= 2 ? [CHICKEN] : [],
      isLoading: false,
    }));
    mockUseRecentFoods.mockReturnValue({ data: [BREAD] });
  });

  it('shows "Recent" section header when search term is empty and recent foods exist', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );
    expect(screen.getByText('Recent')).toBeTruthy();
  });

  it('shows recent food name when search term is empty and recent foods exist', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );
    expect(screen.getByText('White Bread')).toBeTruthy();
  });

  it('shows search results (not recent section) when search term has 2+ chars', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'ch');

    expect(screen.getByText('Chicken Breast')).toBeTruthy();
    expect(screen.queryByText('Recent')).toBeNull();
  });

  it('shows nothing when search term is empty and no recent foods', () => {
    mockUseRecentFoods.mockReturnValue({ data: [] });

    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    expect(screen.queryByText('Recent')).toBeNull();
    expect(screen.queryByText('White Bread')).toBeNull();
  });

  it('tapping a recent food opens the detail sheet', async () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.press(screen.getByText('White Bread'));

    await waitFor(() => {
      expect(screen.getByText('Add to Breakfast')).toBeTruthy();
    });
  });
});
