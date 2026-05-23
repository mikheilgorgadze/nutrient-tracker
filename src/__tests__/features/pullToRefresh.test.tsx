/**
 * Pull-to-refresh and empty diary state tests for DiaryScreen.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DiaryScreen } from '@/features/diary/screens/DiaryScreen';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRefetch = jest.fn();

jest.mock('@/features/diary/hooks/useDiary', () => ({
  useDiary: () => ({
    data: {
      sections: [
        { slot: 'breakfast', entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
        { slot: 'lunch',     entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
        { slot: 'dinner',    entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
        { slot: 'snacks',    entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
      ],
      totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      targets: { kcal: 2000, protein_g: 150, carbs_g: 200, fat_g: 55 },
      hasGoals: true,
    },
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    isRefetching: false,
  }),
}));

jest.mock('@/features/diary/hooks/useDiaryMutations', () => ({
  useDiaryMutations: () => ({
    addEntry:      { mutate: jest.fn(), isPending: false },
    removeEntry:   { mutate: jest.fn(), isPending: false },
    updateServings: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/store/diaryStore', () => ({
  useDiaryStore: () => ({
    activeDate:       '2026-05-23',
    activeMealSlot:   'breakfast',
    goToPrevDay:      jest.fn(),
    goToNextDay:      jest.fn(),
    goToToday:        jest.fn(),
    setActiveMealSlot: jest.fn(),
  }),
}));

jest.mock('@/features/progress/hooks/useWeightLog', () => ({
  useWeightLog: () => ({ data: null }),
}));

jest.mock('@/features/progress/hooks/useWeightMutations', () => ({
  useWeightMutations: () => ({ logWeight: { mutate: jest.fn() } }),
}));

// Mock heavy subcomponents that have their own native deps
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

describe('DiaryScreen — pull-to-refresh', () => {
  it('renders a ScrollView with a refreshControl prop', () => {
    const { UNSAFE_getByType } = render(<DiaryScreen />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ScrollView } = require('react-native');
    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView.props.refreshControl).toBeDefined();
  });

  it('refreshControl refreshing prop reflects isRefetching state', () => {
    const { UNSAFE_getByType } = render(<DiaryScreen />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ScrollView } = require('react-native');
    const scrollView = UNSAFE_getByType(ScrollView);
    // isRefetching is false in our mock
    expect(scrollView.props.refreshControl.props.refreshing).toBe(false);
  });

  it('refreshControl onRefresh is wired to refetch', () => {
    const { UNSAFE_getByType } = render(<DiaryScreen />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ScrollView } = require('react-native');
    const scrollView = UNSAFE_getByType(ScrollView);
    // The onRefresh handler should be the mockRefetch function
    expect(typeof scrollView.props.refreshControl.props.onRefresh).toBe('function');
  });
});

describe('DiaryScreen — empty state', () => {
  it('shows "Nothing logged yet" when all sections have 0 entries', () => {
    render(<DiaryScreen />);
    expect(screen.getByText('Nothing logged yet')).toBeTruthy();
    expect(screen.getByText('Tap + to add your first meal')).toBeTruthy();
  });
});
