/**
 * Settings screen — About section tests.
 * Verifies that the version string and "Fully offline" text render correctly.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

// expo-constants is already mocked in setup.ts with:
//   Constants.expoConfig.extra.ANTHROPIC_API_KEY = 'test-key-for-jest'
// We need to add `version` to that mock. Override it here for this test file.
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: {
        ANTHROPIC_API_KEY: 'test-key-for-jest',
      },
    },
  },
}));

// Mock all the hooks that SettingsTab uses
jest.mock('@/features/goals/hooks/useGoals', () => ({
  useGoals: () => ({ goals: null, isLoading: false }),
}));

jest.mock('@/features/goals/hooks/useGoalsMutations', () => ({
  useGoalsMutations: () => ({
    saveGoals: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/hooks/useDb', () => ({
  useDb: () => null,
}));

jest.mock('@/lib/backup/export', () => ({
  exportBackup: jest.fn(),
}));

jest.mock('@/lib/backup/import', () => ({
  importBackup: jest.fn(),
}));

// GoalsForm is complex — mock it out
jest.mock('@/features/goals/components/GoalsForm', () => ({
  GoalsForm: () => null,
}));

// FeatureErrorBoundary just renders children
jest.mock('@/components/FeatureErrorBoundary', () => ({
  FeatureErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'undetermined' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Settings — About section', () => {
  it('renders the app version from expo-constants', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SettingsTab = require('@/app/(tabs)/settings').default;
    render(<SettingsTab />);
    expect(screen.getByText('NutrientTracker v1.0.0')).toBeTruthy();
  });

  it('renders the "Fully offline" tagline', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SettingsTab = require('@/app/(tabs)/settings').default;
    render(<SettingsTab />);
    expect(screen.getByText('Fully offline · All data stays on your device')).toBeTruthy();
  });
});
