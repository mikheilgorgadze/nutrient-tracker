/**
 * Feature tests for Meal Templates UI.
 * Tests TemplatesSheet and the "Save template" button in MealSection.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TemplatesSheet } from '@/features/diary/components/TemplatesSheet';
import { MealSection } from '@/features/diary/components/MealSection';
import type { DiarySection } from '@/features/diary/hooks/useDiary';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLogTemplate = jest.fn();
const mockDeleteTemplate = jest.fn();
const mockSaveTemplate = jest.fn();

jest.mock('@/features/diary/hooks/useTemplates', () => ({
  useTemplates: () => ({
    templates: [
      { id: 'tpl_001', name: 'My Breakfast', created_at: 1000 },
      { id: 'tpl_002', name: 'Lunch Combo', created_at: 2000 },
    ],
    isLoading: false,
  }),
  useTemplateMutations: () => ({
    saveTemplate: { mutate: mockSaveTemplate, isPending: false },
    deleteTemplate: { mutate: mockDeleteTemplate, isPending: false },
    logTemplate: { mutate: mockLogTemplate, isPending: false },
  }),
}));

jest.mock('@/hooks/useDb', () => ({
  useDb: () => ({}),
}));

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    Swipeable: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSection: DiarySection = {
  slot: 'breakfast',
  entries: [
    {
      id: 'entry_001',
      food_id: 'food_001',
      date: '2026-05-23',
      meal_slot: 'breakfast',
      servings: 1,
      kcal: 300,
      protein_g: 20,
      carbs_g: 30,
      fat_g: 10,
      created_at: 1000,
      food: {
        id: 'food_001',
        name: 'Oatmeal',
        brand: null,
        serving_size_g: 100,
        serving_label: '100g',
        kcal_per_serving: 300,
        protein_g: 20,
        carbs_g: 30,
        fat_g: 10,
        fiber_g: null,
        sugar_g: null,
        sodium_mg: null,
        barcode: null,
        is_custom: 0,
        created_at: 1000,
      },
    },
  ],
  subtotal: { kcal: 300, protein_g: 20, carbs_g: 30, fat_g: 10 },
};

const emptySection: DiarySection = {
  slot: 'lunch',
  entries: [],
  subtotal: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
};

// ── TemplatesSheet tests ───────────────────────────────────────────────────────

describe('TemplatesSheet', () => {
  it('renders template list when templates exist', () => {
    render(
      <TemplatesSheet
        visible={true}
        onClose={jest.fn()}
        activeMealSlot="breakfast"
        activeDate="2026-05-23"
      />
    );
    expect(screen.getByText('My Breakfast')).toBeTruthy();
    expect(screen.getByText('Lunch Combo')).toBeTruthy();
  });

  it('shows close button', () => {
    render(
      <TemplatesSheet
        visible={true}
        onClose={jest.fn()}
        activeMealSlot="breakfast"
        activeDate="2026-05-23"
      />
    );
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    render(
      <TemplatesSheet
        visible={true}
        onClose={onClose}
        activeMealSlot="breakfast"
        activeDate="2026-05-23"
      />
    );
    fireEvent.press(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls logTemplate when a template is pressed', () => {
    render(
      <TemplatesSheet
        visible={true}
        onClose={jest.fn()}
        activeMealSlot="lunch"
        activeDate="2026-05-23"
      />
    );
    fireEvent.press(screen.getByText('My Breakfast'));
    expect(mockLogTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 'tpl_001', mealSlot: 'lunch', date: '2026-05-23' }),
      expect.any(Object),
    );
  });
});

describe('TemplatesSheet — empty state', () => {
  it('shows empty state when no templates exist', () => {
    // Temporarily override useTemplates to return no templates
    const { useTemplates } = require('@/features/diary/hooks/useTemplates');
    const spy = jest.spyOn(require('@/features/diary/hooks/useTemplates'), 'useTemplates')
      .mockReturnValue({ templates: [], isLoading: false });

    render(
      <TemplatesSheet
        visible={true}
        onClose={jest.fn()}
        activeMealSlot="breakfast"
        activeDate="2026-05-23"
      />
    );

    expect(screen.getByText(/No templates saved/)).toBeTruthy();
    spy.mockRestore();
    void useTemplates; // suppress unused import lint
  });
});

// ── MealSection template tests ─────────────────────────────────────────────────

describe('MealSection — save template button', () => {
  it('shows "Save template" button when entries exist and onSaveTemplate is provided', () => {
    render(
      <MealSection
        section={mockSection}
        onDeleteEntry={jest.fn()}
        onSaveTemplate={jest.fn()}
      />
    );
    expect(screen.getByText('Save template')).toBeTruthy();
  });

  it('does not show "Save template" button when entries are empty', () => {
    render(
      <MealSection
        section={emptySection}
        onDeleteEntry={jest.fn()}
        onSaveTemplate={jest.fn()}
      />
    );
    expect(screen.queryByText('Save template')).toBeNull();
  });

  it('does not show "Save template" button when onSaveTemplate is not provided', () => {
    render(
      <MealSection
        section={mockSection}
        onDeleteEntry={jest.fn()}
      />
    );
    expect(screen.queryByText('Save template')).toBeNull();
  });
});
