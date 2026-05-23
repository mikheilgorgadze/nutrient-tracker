/**
 * FoodLogRow — component-level tests.
 * Verifies rendering, press callbacks, swipe-to-delete, and serving label formatting.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { FoodLogRow } from '@/components/FoodLogRow';

// Mock Swipeable: render children + renderRightActions inline so Delete is always visible.
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    Swipeable: ({ children, renderRightActions }: any) => (
      <View>
        {children}
        {renderRightActions?.()}
      </View>
    ),
    GestureHandlerRootView: ({ children }: any) => children,
  };
});

const BASE_PROPS = {
  name: 'Chicken Breast',
  brand: null,
  servings: 1,
  servingLabel: '100g',
  kcal: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
  onDelete: jest.fn(),
  onPress: jest.fn(),
};

describe('FoodLogRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the food name', () => {
    render(<FoodLogRow {...BASE_PROPS} />);
    expect(screen.getByText('Chicken Breast')).toBeTruthy();
  });

  it('renders the calorie count (Math.round)', () => {
    render(<FoodLogRow {...BASE_PROPS} kcal={165.7} />);
    // Math.round(165.7) = 166
    expect(screen.getByText('166')).toBeTruthy();
  });

  it('rounds calories for display', () => {
    render(<FoodLogRow {...BASE_PROPS} kcal={79} />);
    expect(screen.getByText('79')).toBeTruthy();
  });

  it('calls onPress when row is pressed', () => {
    const onPress = jest.fn();
    render(<FoodLogRow {...BASE_PROPS} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Chicken Breast, 165 calories'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when Delete action button is pressed', () => {
    const onDelete = jest.fn();
    render(<FoodLogRow {...BASE_PROPS} onDelete={onDelete} />);
    fireEvent.press(screen.getByLabelText('Delete entry'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows single serving label without multiplier', () => {
    render(<FoodLogRow {...BASE_PROPS} servings={1} servingLabel="1 slice (30g)" />);
    expect(screen.getByText('1 slice (30g)')).toBeTruthy();
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it('shows multi-serving label in "N × label" format', () => {
    render(<FoodLogRow {...BASE_PROPS} servings={2} servingLabel="1 slice (30g)" />);
    expect(screen.getByText('2 × 1 slice (30g)')).toBeTruthy();
  });

  it('renders brand when provided', () => {
    render(<FoodLogRow {...BASE_PROPS} brand="Tyson" />);
    expect(screen.getByText('Tyson')).toBeTruthy();
  });

  it('does not render brand when brand is null', () => {
    render(<FoodLogRow {...BASE_PROPS} brand={null} />);
    expect(screen.queryByText('Tyson')).toBeNull();
  });
});
