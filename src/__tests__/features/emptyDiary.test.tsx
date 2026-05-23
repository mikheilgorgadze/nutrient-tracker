/**
 * Empty diary state tests — verifies the empty state shows/hides correctly.
 * Uses a mutable `mockSections` variable so one mock can cover both cases.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DiaryScreen } from '@/features/diary/screens/DiaryScreen';
import type { DiarySection } from '@/features/diary/hooks/useDiary';

// ── Mutable mock data ──────────────────────────────────────────────────────────

const emptySections: DiarySection[] = [
  { slot: 'breakfast', entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
  { slot: 'lunch',     entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
  { slot: 'dinner',    entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
  { slot: 'snacks',    entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
];

const mockEntry = {
  id: 'entry_1',
  food_id: 'food_1',
  date: '2026-05-23',
  meal_slot: 'breakfast' as const,
  servings: 1,
  kcal: 200,
  protein_g: 10,
  carbs_g: 25,
  fat_g: 5,
  created_at: 0,
  food: {
    id: 'food_1',
    name: 'Oatmeal',
    brand: null,
    serving_size_g: 100,
    serving_label: '1 bowl',
    kcal_per_serving: 200,
    protein_g: 10,
    carbs_g: 25,
    fat_g: 5,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    barcode: null,
    is_custom: 0 as const,
    created_at: 0,
  },
};

const sectionsWithEntry: DiarySection[] = [
  {
    slot: 'breakfast',
    entries: [mockEntry],
    subtotal: { kcal: 200, protein_g: 10, carbs_g: 25, fat_g: 5 },
  },
  { slot: 'lunch',  entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
  { slot: 'dinner', entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
  { slot: 'snacks', entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
];

// The mock reads from this variable so we can swap between test cases
let mockCurrentSections: DiarySection[] = emptySections;

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/features/diary/hooks/useDiary', () => ({
  useDiary: () => ({
    data: {
      sections: mockCurrentSections,
      totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      targets: { kcal: 2000, protein_g: 150, carbs_g: 200, fat_g: 55 },
      hasGoals: true,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

jest.mock('@/features/diary/hooks/useDiaryMutations', () => ({
  useDiaryMutations: () => ({
    addEntry:       { mutate: jest.fn(), isPending: false },
    removeEntry:    { mutate: jest.fn(), isPending: false },
    updateServings: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/store/diaryStore', () => ({
  useDiaryStore: () => ({
    activeDate:        '2026-05-23',
    activeMealSlot:    'breakfast',
    goToPrevDay:       jest.fn(),
    goToNextDay:       jest.fn(),
    goToToday:         jest.fn(),
    setActiveMealSlot: jest.fn(),
  }),
}));

jest.mock('@/features/progress/hooks/useWeightLog', () => ({
  useWeightLog: () => ({ data: null }),
}));

jest.mock('@/features/progress/hooks/useWeightMutations', () => ({
  useWeightMutations: () => ({ logWeight: { mutate: jest.fn() } }),
}));

jest.mock('@/features/diary/components/DiaryHeader', () => ({
  DiaryHeader: () => null,
}));

jest.mock('@/features/foods/components/FoodSearchModal', () => ({
  FoodSearchModal: () => null,
}));

jest.mock('@/features/diary/components/EditEntrySheet', () => ({
  EditEntrySheet: () => null,
}));

jest.mock('@/features/progress/components/WeightEntrySheet', () => ({
  WeightEntrySheet: () => null,
}));

jest.mock('@/features/diary/components/AddEntryFAB', () => ({
  AddEntryFAB: () => null,
}));

jest.mock('@/features/diary/hooks/useTemplates', () => ({
  useTemplateMutations: () => ({
    saveTemplate: { mutate: jest.fn(), isPending: false },
    deleteTemplate: { mutate: jest.fn(), isPending: false },
    logTemplate: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/diary/components/TemplatesSheet', () => ({
  TemplatesSheet: () => null,
}));

jest.mock('@/lib/db', () => ({
  today: () => '2026-05-24',
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiaryScreen — empty state visibility', () => {
  beforeEach(() => {
    // Reset to empty sections before each test
    mockCurrentSections = emptySections;
  });

  it('shows "Nothing logged yet" when all sections have 0 entries', () => {
    mockCurrentSections = emptySections;
    render(<DiaryScreen />);
    expect(screen.getByText('Nothing logged yet')).toBeTruthy();
    expect(screen.getByText('Tap + to add your first meal')).toBeTruthy();
  });

  it('hides empty state when at least one entry exists', () => {
    mockCurrentSections = sectionsWithEntry;
    render(<DiaryScreen />);
    expect(screen.queryByText('Nothing logged yet')).toBeNull();
  });
});
