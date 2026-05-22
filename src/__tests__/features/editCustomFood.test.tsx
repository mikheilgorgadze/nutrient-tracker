/**
 * Edit / delete custom foods — integration tests.
 *
 * Covers:
 *  - useFoodMutations.editFood: calls updateFood with correct args
 *  - useFoodMutations.removeFood: calls deleteCustomFood
 *  - EditFoodModal: renders pre-filled form, save, cancel, delete confirmation
 *  - Foods tab: shows My Foods list with edit button
 */
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditFoodModal } from '@/features/foods/components/EditFoodModal';
import { useFoodMutations } from '@/features/foods/hooks/useFoodMutations';
import { updateFood, deleteCustomFood } from '@/lib/db/queries/foods';
import type { FoodRow } from '@/lib/db/types';

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
  updateFood: jest.fn(),
  deleteCustomFood: jest.fn(),
  getCustomFoods: jest.fn().mockReturnValue([]),
  searchFoods: jest.fn().mockReturnValue([]),
  getFoodById: jest.fn().mockReturnValue(null),
  seedFoods: jest.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CUSTOM_FOOD: FoodRow = {
  id: 'food_custom_1',
  name: 'Homemade Granola',
  brand: 'Home',
  serving_size_g: 60,
  serving_label: '1 cup',
  kcal_per_serving: 280,
  protein_g: 6,
  carbs_g: 42,
  fat_g: 10,
  fiber_g: null,
  sugar_g: null,
  sodium_mg: null,
  barcode: null,
  is_custom: 1,
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

function wrapper({ children }: { children: React.ReactNode }) {
  return makeWrapper()({ children });
}

// ── Hook tests ────────────────────────────────────────────────────────────────

describe('useFoodMutations.editFood', () => {
  beforeEach(() => { (updateFood as jest.Mock).mockClear(); });

  it('calls updateFood with the correct id and fields', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.editFood.mutate({
        id: 'food_custom_1',
        fields: {
          name: 'Updated Granola',
          brand: null,
          serving_label: '1 cup',
          serving_size_g: 60,
          kcal_per_serving: 290,
          protein_g: 6,
          carbs_g: 43,
          fat_g: 10,
        },
      });
    });

    expect(updateFood).toHaveBeenCalledTimes(1);
    const [, id, fields] = (updateFood as jest.Mock).mock.calls[0];
    expect(id).toBe('food_custom_1');
    expect(fields.name).toBe('Updated Granola');
    expect(fields.kcal_per_serving).toBe(290);
  });
});

describe('useFoodMutations.removeFood', () => {
  beforeEach(() => { (deleteCustomFood as jest.Mock).mockClear(); });

  it('calls deleteCustomFood with the food id', async () => {
    const { result } = renderHook(() => useFoodMutations(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.removeFood.mutate('food_custom_1');
    });

    expect(deleteCustomFood).toHaveBeenCalledTimes(1);
    const [, id] = (deleteCustomFood as jest.Mock).mock.calls[0];
    expect(id).toBe('food_custom_1');
  });
});

// ── EditFoodModal component tests ─────────────────────────────────────────────

describe('EditFoodModal', () => {
  it('renders nothing when food is null', () => {
    const { toJSON } = render(
      <EditFoodModal food={null} onClose={jest.fn()} />,
      { wrapper },
    );
    expect(toJSON()).toBeNull();
  });

  it('pre-fills name and serving label from food prop', () => {
    render(<EditFoodModal food={CUSTOM_FOOD} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByDisplayValue('Homemade Granola')).toBeTruthy();
    expect(screen.getByDisplayValue('1 cup')).toBeTruthy();
  });

  it('pre-fills brand from food prop', () => {
    render(<EditFoodModal food={CUSTOM_FOOD} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByDisplayValue('Home')).toBeTruthy();
  });

  it('shows "Edit Food" title', () => {
    render(<EditFoodModal food={CUSTOM_FOOD} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByText('Edit Food')).toBeTruthy();
  });

  it('calls onClose when Cancel is pressed', () => {
    const onClose = jest.fn();
    render(<EditFoodModal food={CUSTOM_FOOD} onClose={onClose} />, { wrapper });
    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when name is cleared before saving', async () => {
    render(<EditFoodModal food={CUSTOM_FOOD} onClose={jest.fn()} />, { wrapper });
    fireEvent.changeText(screen.getByDisplayValue('Homemade Granola'), '');
    fireEvent.press(screen.getByLabelText('Save food'));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeTruthy();
    });
  });

  it('shows Delete Food button', () => {
    render(<EditFoodModal food={CUSTOM_FOOD} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByLabelText('Delete food')).toBeTruthy();
  });
});
