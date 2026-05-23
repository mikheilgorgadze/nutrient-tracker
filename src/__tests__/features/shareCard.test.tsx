/**
 * Share card tests — DailySummaryCard rendering and DiaryScreen share button.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { DailySummaryCard } from '@/features/diary/components/DailySummaryCard';
import { DiaryScreen } from '@/features/diary/screens/DiaryScreen';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('file:///tmp/snapshot.png'),
}));

jest.mock('@/features/diary/components/ShareModal', () => ({
  ShareModal: ({ visible }: { visible: boolean; onCapture: () => Promise<string> }) =>
    visible
      ? require('react').createElement(require('react-native').Text, null, 'SHARE_MODAL_OPEN')
      : null,
}));

jest.mock('@/features/diary/hooks/useDiary', () => ({
  useDiary: () => ({
    data: {
      sections: [
        { slot: 'breakfast', entries: [], subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } },
      ],
      totals: { kcal: 1850, protein_g: 140, carbs_g: 210, fat_g: 52 },
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

jest.mock('@/features/diary/hooks/useTemplates', () => ({
  useTemplateMutations: () => ({
    saveTemplate: { mutate: jest.fn(), isPending: false },
    deleteTemplate: { mutate: jest.fn(), isPending: false },
    logTemplate: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/diary/components/DiaryHeader',    () => ({ DiaryHeader:    () => null }));
jest.mock('@/features/foods/components/FoodSearchModal', () => ({ FoodSearchModal: () => null }));
jest.mock('@/features/diary/components/EditEntrySheet',  () => ({ EditEntrySheet:  () => null }));
jest.mock('@/features/progress/components/WeightEntrySheet', () => ({ WeightEntrySheet: () => null }));
jest.mock('@/features/diary/components/AddEntryFAB',     () => ({ AddEntryFAB:     () => null }));
jest.mock('@/features/diary/components/TemplatesSheet',  () => ({ TemplatesSheet:  () => null }));

jest.mock('@/lib/db', () => ({
  today: () => '2026-05-23',
}));

// ── DailySummaryCard tests ─────────────────────────────────────────────────────

const totals = { kcal: 1850, protein_g: 140, carbs_g: 210, fat_g: 52 };
const targets = { kcal: 2000, protein_g: 150, carbs_g: 200, fat_g: 55 };

describe('DailySummaryCard', () => {
  it('renders calorie total', () => {
    render(
      <DailySummaryCard date="2026-05-23" totals={totals} targets={targets} />
    );
    expect(screen.getByText('1850')).toBeTruthy();
  });

  it('shows remaining budget when under target', () => {
    render(
      <DailySummaryCard date="2026-05-23" totals={totals} targets={targets} />
    );
    expect(screen.getByText('150 left')).toBeTruthy();
  });

  it('shows over-budget label when calories exceed target', () => {
    const overTotals = { ...totals, kcal: 2200 };
    render(
      <DailySummaryCard date="2026-05-23" totals={overTotals} targets={targets} />
    );
    expect(screen.getByText('+200 over')).toBeTruthy();
  });

  it('renders macro labels', () => {
    render(
      <DailySummaryCard date="2026-05-23" totals={totals} targets={targets} />
    );
    expect(screen.getByText('Protein')).toBeTruthy();
    expect(screen.getByText('Carbs')).toBeTruthy();
    expect(screen.getByText('Fat')).toBeTruthy();
  });

  it('renders app name and footer', () => {
    render(
      <DailySummaryCard date="2026-05-23" totals={totals} targets={targets} />
    );
    expect(screen.getByText('NutrientTracker')).toBeTruthy();
    expect(screen.getByText(/Fully offline/)).toBeTruthy();
  });
});

// ── DiaryScreen share button tests ────────────────────────────────────────────

describe('DiaryScreen — share button', () => {
  it('renders a Share button', () => {
    render(<DiaryScreen />);
    expect(screen.getByLabelText('Share daily summary')).toBeTruthy();
  });

  it('opens ShareModal when share button is pressed', async () => {
    render(<DiaryScreen />);
    expect(screen.queryByText('SHARE_MODAL_OPEN')).toBeNull();
    fireEvent.press(screen.getByLabelText('Share daily summary'));
    await waitFor(() =>
      expect(screen.getByText('SHARE_MODAL_OPEN')).toBeTruthy(),
    );
  });
});
