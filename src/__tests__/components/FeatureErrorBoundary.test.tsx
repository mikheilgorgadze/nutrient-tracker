/**
 * FeatureErrorBoundary — catches render errors and shows a recovery UI.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

// Suppress expected error output in test logs
const originalError = console.error;
beforeAll(() => { console.error = jest.fn(); });
afterAll(() => { console.error = originalError; });

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Boom from Bomb');
  return <></>;
}

describe('FeatureErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <FeatureErrorBoundary>
        <Bomb shouldThrow={false} />
      </FeatureErrorBoundary>
    );
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('catches a render error and shows fallback UI', () => {
    render(
      <FeatureErrorBoundary>
        <Bomb shouldThrow={true} />
      </FeatureErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Boom from Bomb')).toBeTruthy();
  });

  it('shows custom fallbackTitle when provided', () => {
    render(
      <FeatureErrorBoundary fallbackTitle="Could not load diary">
        <Bomb shouldThrow={true} />
      </FeatureErrorBoundary>
    );
    expect(screen.getByText('Could not load diary')).toBeTruthy();
  });

  it('shows a Try again button in the error fallback UI', () => {
    render(
      <FeatureErrorBoundary>
        <Bomb shouldThrow={true} />
      </FeatureErrorBoundary>
    );
    // Error UI is shown
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    // Try again button is accessible
    expect(screen.getByLabelText('Try again')).toBeTruthy();
    // Pressing it does not crash
    expect(() => fireEvent.press(screen.getByLabelText('Try again'))).not.toThrow();
  });
});
