/**
 * EditEntrySheet — meal slot picker + servings editing.
 */
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { EditEntrySheet } from '@/features/diary/components/EditEntrySheet';
import type { DiaryEntryWithFood } from '@/lib/db/types';

const ENTRY: DiaryEntryWithFood = {
  id: 'entry_1',
  food_id: 'food_1',
  date: '2026-05-22',
  meal_slot: 'breakfast',
  servings: 1,
  kcal: 79,
  protein_g: 2.7,
  carbs_g: 15,
  fat_g: 1,
  created_at: 0,
  food: {
    id: 'food_1',
    name: 'White Bread',
    brand: null,
    serving_size_g: 30,
    serving_label: '1 slice (30g)',
    kcal_per_serving: 79,
    protein_g: 2.7,
    carbs_g: 15,
    fat_g: 1,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    barcode: null,
    is_custom: 0,
    created_at: 0,
  },
};

describe('EditEntrySheet', () => {
  it('renders null when entry is null', () => {
    const { toJSON } = render(
      <EditEntrySheet entry={null} onClose={jest.fn()} onUpdate={jest.fn()} onDelete={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('shows the food name', () => {
    render(
      <EditEntrySheet entry={ENTRY} onClose={jest.fn()} onUpdate={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByText('White Bread')).toBeTruthy();
  });

  it('shows all four meal slot chips', () => {
    render(
      <EditEntrySheet entry={ENTRY} onClose={jest.fn()} onUpdate={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByLabelText('Breakfast')).toBeTruthy();
    expect(screen.getByLabelText('Lunch')).toBeTruthy();
    expect(screen.getByLabelText('Dinner')).toBeTruthy();
    expect(screen.getByLabelText('Snacks')).toBeTruthy();
  });

  it('pre-selects the entry meal slot', () => {
    render(
      <EditEntrySheet entry={ENTRY} onClose={jest.fn()} onUpdate={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByLabelText('Breakfast')).toHaveProp('accessibilityState', { selected: true });
    expect(screen.getByLabelText('Lunch')).toHaveProp('accessibilityState', { selected: false });
  });

  it('passes the selected meal slot to onUpdate', async () => {
    const onUpdate = jest.fn();
    render(
      <EditEntrySheet entry={ENTRY} onClose={jest.fn()} onUpdate={onUpdate} onDelete={jest.fn()} />
    );

    fireEvent.press(screen.getByLabelText('Dinner'));
    fireEvent.press(screen.getByLabelText('Update servings'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'entry_1',
        1,
        ENTRY.food,
        'dinner',
      );
    });
  });

  it('passes the original meal slot when not changed', async () => {
    const onUpdate = jest.fn();
    render(
      <EditEntrySheet entry={ENTRY} onClose={jest.fn()} onUpdate={onUpdate} onDelete={jest.fn()} />
    );
    fireEvent.press(screen.getByLabelText('Update servings'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('entry_1', 1, ENTRY.food, 'breakfast');
    });
  });

  it('calls onDelete when Delete Entry is pressed', () => {
    const onDelete = jest.fn();
    const onClose = jest.fn();
    render(
      <EditEntrySheet entry={ENTRY} onClose={onClose} onUpdate={jest.fn()} onDelete={onDelete} />
    );
    fireEvent.press(screen.getByLabelText('Delete entry'));
    expect(onDelete).toHaveBeenCalledWith('entry_1');
    expect(onClose).toHaveBeenCalled();
  });
});
