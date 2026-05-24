/**
 * Keyboard avoidance tests — every screen/sheet with a text input must
 * wrap its content in a KeyboardAvoidingView so the keyboard doesn't
 * obscure the focused field.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function withQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

// ── Shared mocks ───────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({ today: () => '2026-05-24' }));

jest.mock('@/features/foods/hooks/useFoodSearch', () => ({
  useFoodSearch: () => ({ results: [], isLoading: false }),
}));

jest.mock('@/features/foods/hooks/useRecentFoods', () => ({
  useRecentFoods: () => ({ data: [] }),
}));

jest.mock('@/features/foods/hooks/useLabelScan', () => ({
  useLabelScan: () => ({ state: { status: 'idle' }, scanLabel: jest.fn(), reset: jest.fn() }),
}));

jest.mock('@/features/diary/hooks/useTemplates', () => ({
  useTemplateMutations: () => ({
    saveTemplate:   { mutate: jest.fn(), isPending: false },
    deleteTemplate: { mutate: jest.fn(), isPending: false },
    logTemplate:    { mutate: jest.fn(), isPending: false },
  }),
  useTemplates: () => ({ data: [] }),
}));

jest.mock('@/lib/algorithms/macros', () => ({
  macrosForServings: (_food: unknown, s: number) => ({
    kcal: 100 * s, protein_g: 10 * s, carbs_g: 10 * s, fat_g: 5 * s,
  }),
}));

// ── FoodSearchModal ────────────────────────────────────────────────────────────

import { FoodSearchModal } from '@/features/foods/components/FoodSearchModal';

jest.mock('@/features/diary/hooks/useDiaryMutations', () => ({
  useDiaryMutations: () => ({
    addEntry:       { mutate: jest.fn(), isPending: false },
    removeEntry:    { mutate: jest.fn(), isPending: false },
    updateServings: { mutate: jest.fn(), isPending: false },
  }),
}));

describe('FoodSearchModal', () => {
  it('contains a KeyboardAvoidingView', () => {
    render(withQuery(<FoodSearchModal visible onClose={jest.fn()} initialMealSlot="breakfast" />));
    expect(screen.UNSAFE_getAllByType(
      require('react-native').KeyboardAvoidingView,
    ).length).toBeGreaterThan(0);
  });
});

// ── EditEntrySheet ─────────────────────────────────────────────────────────────

import { EditEntrySheet } from '@/features/diary/components/EditEntrySheet';

const mockEntry = {
  id: 'e1',
  food_id: 'f1',
  date: '2026-05-24',
  meal_slot: 'breakfast' as const,
  servings: 1,
  kcal: 200,
  protein_g: 20,
  carbs_g: 20,
  fat_g: 8,
  created_at: 0,
  food: {
    id: 'f1', name: 'Oats', brand: null, serving_size_g: 100,
    serving_label: 'g', kcal_per_serving: 380, protein_g: 13,
    carbs_g: 68, fat_g: 7, is_custom: 0, created_at: 0,
  },
};

describe('EditEntrySheet', () => {
  it('contains a KeyboardAvoidingView', () => {
    render(
      <EditEntrySheet
        entry={mockEntry}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.UNSAFE_getAllByType(
      require('react-native').KeyboardAvoidingView,
    ).length).toBeGreaterThan(0);
  });
});

// ── FoodDetailSheet ────────────────────────────────────────────────────────────

import { FoodDetailSheet } from '@/features/foods/components/FoodDetailSheet';

const mockFood = {
  id: 'f1', name: 'Chicken Breast', brand: null, serving_size_g: 100,
  serving_label: 'g', kcal_per_serving: 165, protein_g: 31,
  carbs_g: 0, fat_g: 3.6, is_custom: 0, created_at: 0,
};

describe('FoodDetailSheet', () => {
  it('contains a KeyboardAvoidingView', () => {
    render(
      <FoodDetailSheet
        food={mockFood}
        onClose={jest.fn()}
        onAdd={jest.fn()}
        mealSlot="lunch"
      />,
    );
    expect(screen.UNSAFE_getAllByType(
      require('react-native').KeyboardAvoidingView,
    ).length).toBeGreaterThan(0);
  });
});

// ── GoalsForm ──────────────────────────────────────────────────────────────────

import { GoalsForm } from '@/features/goals/components/GoalsForm';

describe('GoalsForm', () => {
  it('contains a KeyboardAvoidingView', () => {
    render(<GoalsForm onSave={jest.fn()} />);
    expect(screen.UNSAFE_getAllByType(
      require('react-native').KeyboardAvoidingView,
    ).length).toBeGreaterThan(0);
  });
});

// ── CreateFoodModal ────────────────────────────────────────────────────────────

import { CreateFoodModal } from '@/features/foods/components/CreateFoodModal';

jest.mock('@/features/foods/hooks/useFoodMutations', () => ({
  useFoodMutations: () => ({ createFood: { mutate: jest.fn(), isPending: false } }),
}));

describe('CreateFoodModal', () => {
  it('contains a KeyboardAvoidingView', () => {
    render(<CreateFoodModal visible onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.UNSAFE_getAllByType(
      require('react-native').KeyboardAvoidingView,
    ).length).toBeGreaterThan(0);
  });
});
