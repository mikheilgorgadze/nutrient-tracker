/**
 * NumberInput — component-level tests.
 * Verifies keyboard behaviour, suffix rendering, and value change callbacks.
 */
import React from 'react';
import { TextInput, Keyboard } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NumberInput } from '@/components/NumberInput';

describe('NumberInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with returnKeyType="done"', () => {
    const { UNSAFE_getByType } = render(
      <NumberInput value={1} onChangeValue={jest.fn()} />
    );
    const input = UNSAFE_getByType(TextInput);
    expect(input.props.returnKeyType).toBe('done');
  });

  it('calls Keyboard.dismiss when onSubmitEditing fires', () => {
    const spy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    const { UNSAFE_getByType } = render(
      <NumberInput value={1} onChangeValue={jest.fn()} />
    );
    const input = UNSAFE_getByType(TextInput);
    fireEvent(input, 'submitEditing');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('renders suffix text when suffix prop is provided', () => {
    const { getByText } = render(
      <NumberInput value={1} onChangeValue={jest.fn()} suffix="servings" />
    );
    expect(getByText('servings')).toBeTruthy();
  });

  it('does not render suffix when suffix prop is omitted', () => {
    const { queryByText } = render(
      <NumberInput value={1} onChangeValue={jest.fn()} />
    );
    expect(queryByText('servings')).toBeNull();
  });

  it('calls onChangeValue with parsed number after debounce', () => {
    const onChangeValue = jest.fn();
    const { UNSAFE_getByType } = render(
      <NumberInput value={1} onChangeValue={onChangeValue} debounceMs={300} />
    );
    const input = UNSAFE_getByType(TextInput);

    fireEvent.changeText(input, '2.5');

    // Before debounce fires, callback not yet called
    expect(onChangeValue).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onChangeValue).toHaveBeenCalledWith(2.5);
  });

  it('ignores non-numeric input (no callback fired)', () => {
    const onChangeValue = jest.fn();
    const { UNSAFE_getByType } = render(
      <NumberInput value={1} onChangeValue={onChangeValue} debounceMs={300} />
    );
    const input = UNSAFE_getByType(TextInput);

    fireEvent.changeText(input, 'abc');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // 'abc' sanitizes to '' which parses as NaN — callback should not fire
    expect(onChangeValue).not.toHaveBeenCalled();
  });

  it('clamps value to min when input is below minimum', () => {
    const onChangeValue = jest.fn();
    const { UNSAFE_getByType } = render(
      <NumberInput value={1} onChangeValue={onChangeValue} min={0.5} debounceMs={300} />
    );
    const input = UNSAFE_getByType(TextInput);

    fireEvent.changeText(input, '0.1');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onChangeValue).toHaveBeenCalledWith(0.5);
  });

  it('clamps value to max when input exceeds maximum', () => {
    const onChangeValue = jest.fn();
    const { UNSAFE_getByType } = render(
      <NumberInput value={1} onChangeValue={onChangeValue} max={10} debounceMs={300} />
    );
    const input = UNSAFE_getByType(TextInput);

    fireEvent.changeText(input, '50');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onChangeValue).toHaveBeenCalledWith(10);
  });
});
