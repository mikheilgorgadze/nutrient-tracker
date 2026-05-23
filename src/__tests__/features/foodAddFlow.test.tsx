/**
 * Food add flow — integration tests.
 *
 * Covers the full path a user takes to log food:
 *   search → tap result → detail sheet appears → tap Add → mutation fires
 *
 * useFoodSearch and useDiaryMutations are mocked so the test stays fast and
 * doesn't need a real SQLite database. The UI wiring (state, renders, events)
 * is exercised against real component code.
 */
import React from 'react';
import { Keyboard } from 'react-native';
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

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockAddMutate = jest.fn();
const mockCreateMutate = jest.fn();
const mockUseFoodSearch = jest.fn((term: string) => ({
  results: term.length >= 2 ? [BREAD] : [],
  isLoading: false,
}));

jest.mock('@/features/foods/hooks/useFoodSearch', () => ({
  useFoodSearch: (term: string) => mockUseFoodSearch(term),
}));

jest.mock('@/features/diary/hooks/useDiaryMutations', () => ({
  useDiaryMutations: () => ({
    addEntry: { mutate: mockAddMutate, isPending: false },
    removeEntry: { mutate: jest.fn(), isPending: false },
    updateServings: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/foods/hooks/useFoodMutations', () => ({
  useFoodMutations: () => ({
    createFood: { mutate: mockCreateMutate, isPending: false },
  }),
}));

// ── Test wrapper ──────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Food add flow (FoodSearchModal)', () => {
  beforeEach(() => {
    mockAddMutate.mockClear();
    mockCreateMutate.mockClear();
    // Restore default: returns BREAD for 2+ char terms
    mockUseFoodSearch.mockImplementation((term: string) => ({
      results: term.length >= 2 ? [BREAD] : [],
      isLoading: false,
    }));
  });

  it('shows no results when search term is empty', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );
    expect(screen.queryByText('White Bread')).toBeNull();
  });

  it('shows food results when search term has 2+ characters', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'wh');

    expect(screen.getByText('White Bread')).toBeTruthy();
  });

  it('shows FoodDetailSheet when a result is tapped', async () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'wh');
    fireEvent.press(screen.getByText('White Bread'));

    await waitFor(() => {
      expect(screen.getByText('Add to Breakfast')).toBeTruthy();
    });
  });

  it('calls addEntry.mutate with correct args when Add is pressed', async () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    // Search → tap result → detail sheet
    fireEvent.changeText(screen.getByLabelText('Search foods'), 'wh');
    fireEvent.press(screen.getByText('White Bread'));

    await waitFor(() => screen.getByText('Add to Breakfast'));

    // Tap the Add button
    fireEvent.press(screen.getByText('Add to Breakfast'));

    expect(mockAddMutate).toHaveBeenCalledTimes(1);
    expect(mockAddMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        food: BREAD,
        servings: 1,
        mealSlot: 'breakfast',
      })
    );
  });

  it('passes the correct meal slot when initialMealSlot is dinner', async () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="dinner" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'wh');
    fireEvent.press(screen.getByText('White Bread'));

    await waitFor(() => screen.getByText('Add to Dinner'));
    fireEvent.press(screen.getByText('Add to Dinner'));

    expect(mockAddMutate).toHaveBeenCalledWith(
      expect.objectContaining({ mealSlot: 'dinner' })
    );
  });

  it('hides the detail sheet after Add is pressed', async () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'wh');
    fireEvent.press(screen.getByText('White Bread'));
    await waitFor(() => screen.getByText('Add to Breakfast'));

    fireEvent.press(screen.getByText('Add to Breakfast'));

    // selectedFood is reset to null → FoodDetailSheet returns null
    await waitFor(() => {
      expect(screen.queryByText('Add to Breakfast')).toBeNull();
    });
  });

  it('shows a Create button in the empty state when search has no results', async () => {
    // Override to return empty results for this test
    mockUseFoodSearch.mockReturnValue({ results: [], isLoading: false });

    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'zz');

    await waitFor(() => {
      expect(screen.getByText(/No results for/)).toBeTruthy();
      expect(screen.getByText(/Create "zz"/)).toBeTruthy();
    });
  });

  it('always shows the + create icon button in the search bar', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );
    expect(screen.getByLabelText('Create custom food')).toBeTruthy();
  });

  it('dismisses keyboard when a food result is tapped', async () => {
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);

    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'wh');
    fireEvent.press(screen.getByText('White Bread'));

    expect(dismissSpy).toHaveBeenCalled();

    dismissSpy.mockRestore();
  });
});
