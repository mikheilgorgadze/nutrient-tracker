/**
 * Copy to Today feature — EditEntrySheet tests.
 *
 * Verifies the "Copy to Today" button appears/disappears based on the
 * onCopyToToday prop, fires the correct callback, and calls onClose.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { EditEntrySheet } from '@/features/diary/components/EditEntrySheet';
import type { DiaryEntryWithFood } from '@/lib/db/types';

// ── Fixture ───────────────────────────────────────────────────────────────────

const ENTRY: DiaryEntryWithFood = {
  id: 'entry_001',
  food_id: 'food_bread',
  date: '2026-05-20',
  meal_slot: 'breakfast',
  servings: 1,
  kcal: 79,
  protein_g: 2.7,
  carbs_g: 15,
  fat_g: 1.0,
  created_at: 0,
  food: {
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
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EditEntrySheet — Copy to Today', () => {
  it('shows "Copy to Today" button when onCopyToToday prop is provided', () => {
    render(
      <EditEntrySheet
        entry={ENTRY}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onCopyToToday={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Copy to today')).toBeTruthy();
    expect(screen.getByText('Copy to Today')).toBeTruthy();
  });

  it('does NOT show "Copy to Today" button when onCopyToToday is undefined', () => {
    render(
      <EditEntrySheet
        entry={ENTRY}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.queryByLabelText('Copy to today')).toBeNull();
    expect(screen.queryByText('Copy to Today')).toBeNull();
  });

  it('calls onCopyToToday with (food, servings, mealSlot) when pressed', () => {
    const onCopyToToday = jest.fn();
    render(
      <EditEntrySheet
        entry={ENTRY}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onCopyToToday={onCopyToToday}
      />
    );

    fireEvent.press(screen.getByLabelText('Copy to today'));

    expect(onCopyToToday).toHaveBeenCalledTimes(1);
    expect(onCopyToToday).toHaveBeenCalledWith(
      ENTRY.food,
      ENTRY.servings,
      ENTRY.meal_slot,
    );
  });

  it('calls onClose when "Copy to Today" is pressed', () => {
    const onClose = jest.fn();
    render(
      <EditEntrySheet
        entry={ENTRY}
        onClose={onClose}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onCopyToToday={jest.fn()}
      />
    );

    fireEvent.press(screen.getByLabelText('Copy to today'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when entry is null', () => {
    render(
      <EditEntrySheet
        entry={null}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onCopyToToday={jest.fn()}
      />
    );
    expect(screen.queryByText('Copy to Today')).toBeNull();
  });
});
