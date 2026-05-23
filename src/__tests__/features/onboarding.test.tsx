/**
 * Onboarding gate tests for src/app/index.tsx.
 *
 * Verifies that the root route shows a loading indicator while goals are
 * loading, redirects to /(tabs)/diary when goals exist, and redirects to
 * /onboarding when no goals are set.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Index from '@/app/index';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Use a require-based factory so React isn't accessed as an out-of-scope variable.
jest.mock('expo-router', () => {
  const mockReact = require('react');
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => mockReact.createElement(Text, null, href),
    useRouter: () => ({ push: jest.fn() }),
    router: { push: jest.fn() },
  };
});

const mockUseGoals = jest.fn();

jest.mock('@/features/goals/hooks/useGoals', () => ({
  useGoals: () => mockUseGoals(),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Index route — onboarding gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an ActivityIndicator while goals are loading', () => {
    mockUseGoals.mockReturnValue({ goals: null, isLoading: true });

    const { UNSAFE_getByType } = render(<Index />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('redirects to /(tabs)/diary when goals exist', () => {
    mockUseGoals.mockReturnValue({
      goals: { id: 1, kcal: 2000, protein_g: 150, carbs_g: 200, fat_g: 55 },
      isLoading: false,
    });

    render(<Index />);
    expect(screen.getByText('/(tabs)/diary')).toBeTruthy();
  });

  it('redirects to /onboarding when goals are null', () => {
    mockUseGoals.mockReturnValue({ goals: null, isLoading: false });

    render(<Index />);
    expect(screen.getByText('/onboarding')).toBeTruthy();
  });
});
