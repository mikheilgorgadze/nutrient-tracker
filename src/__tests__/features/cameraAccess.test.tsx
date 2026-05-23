/**
 * Camera access from FoodSearchModal tests.
 *
 * Verifies that the camera button is rendered in the search bar and
 * navigates to the camera screen when pressed.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FoodSearchModal } from '@/features/foods/components/FoodSearchModal';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('@/features/foods/hooks/useFoodSearch', () => ({
  useFoodSearch: () => ({ results: [], isLoading: false }),
}));

jest.mock('@/features/foods/hooks/useRecentFoods', () => ({
  useRecentFoods: () => ({ data: [] }),
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

describe('Camera access from FoodSearchModal', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  it('renders a "Scan food photo" button in the search bar', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );
    expect(screen.getByLabelText('Scan food photo')).toBeTruthy();
  });

  it('calls router.push with "/camera" when the camera button is pressed', () => {
    render(
      <FoodSearchModal visible={true} onClose={jest.fn()} initialMealSlot="breakfast" />,
      { wrapper }
    );

    fireEvent.press(screen.getByLabelText('Scan food photo'));

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith('/camera');
  });
});
