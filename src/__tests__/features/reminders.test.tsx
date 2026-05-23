/**
 * Reminders tests — unit tests for reminder helpers + RemindersSection UI.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSchedule = jest.fn().mockResolvedValue('notif-id-123');
const mockCancel   = jest.fn().mockResolvedValue(undefined);
const mockGetPerms = jest.fn().mockResolvedValue({ granted: true, canAskAgain: true });
const mockReqPerms = jest.fn().mockResolvedValue({ granted: true, canAskAgain: true });

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  getPermissionsAsync: () => mockGetPerms(),
  requestPermissionsAsync: () => mockReqPerms(),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// ── Reminder helper unit tests ─────────────────────────────────────────────────

import {
  scheduleReminder,
  cancelReminder,
  cancelAllReminders,
  requestNotificationPermission,
  MEAL_REMINDERS,
} from '@/lib/notifications/reminders';

describe('reminder helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scheduleReminder cancels existing then schedules when enabled', async () => {
    const meal = MEAL_REMINDERS[0]; // breakfast
    await scheduleReminder(meal, { enabled: true, hour: 8, minute: 0 });

    // cancel called first
    expect(mockCancel).toHaveBeenCalledWith('reminder_breakfast');
    // then schedule
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'reminder_breakfast' }),
    );
  });

  it('scheduleReminder cancels and does NOT schedule when disabled', async () => {
    const meal = MEAL_REMINDERS[1]; // lunch
    const result = await scheduleReminder(meal, { enabled: false, hour: 12, minute: 30 });

    expect(mockCancel).toHaveBeenCalledWith('reminder_lunch');
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('cancelReminder calls cancelScheduledNotificationAsync with correct id', async () => {
    await cancelReminder('dinner');
    expect(mockCancel).toHaveBeenCalledWith('reminder_dinner');
  });

  it('cancelAllReminders cancels every meal', async () => {
    await cancelAllReminders();
    for (const meal of MEAL_REMINDERS) {
      expect(mockCancel).toHaveBeenCalledWith(`reminder_${meal.id}`);
    }
  });

  it('requestNotificationPermission returns true when granted', async () => {
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });

  it('requestNotificationPermission returns false when denied', async () => {
    mockReqPerms.mockResolvedValueOnce({ granted: false, canAskAgain: false });
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

// ── RemindersSection UI tests ─────────────────────────────────────────────────

import { RemindersSection } from '@/features/settings/components/RemindersSection';

describe('RemindersSection — granted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPerms.mockResolvedValue({ granted: true, canAskAgain: true });
  });

  it('renders all 4 meal labels', () => {
    render(<RemindersSection />);
    expect(screen.getByText('Breakfast')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Dinner')).toBeTruthy();
    expect(screen.getByText('Snacks')).toBeTruthy();
  });

  it('all switches start off', () => {
    render(<RemindersSection />);
    const switches = screen.getAllByRole('switch');
    for (const sw of switches) {
      expect(sw.props.value).toBe(false);
    }
  });

  it('toggling a switch on schedules the reminder', async () => {
    render(<RemindersSection />);
    fireEvent(screen.getAllByRole('switch')[0], 'onValueChange', true);
    await waitFor(() => expect(mockSchedule).toHaveBeenCalled());
  });

  it('toggling a switch off cancels the reminder', async () => {
    render(<RemindersSection />);
    const switches = screen.getAllByRole('switch');
    fireEvent(switches[1], 'onValueChange', true);
    await waitFor(() => expect(mockSchedule).toHaveBeenCalled());
    fireEvent(switches[1], 'onValueChange', false);
    // cancelReminder called when scheduling (clears old) + when disabling
    await waitFor(() => expect(mockCancel).toHaveBeenCalledTimes(2));
  });
});

describe('RemindersSection — unavailable (Expo Go)', () => {
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Simulate Expo Go: getNotificationPermissionStatus returns 'unavailable'
    statusSpy = jest.spyOn(
      require('@/lib/notifications/reminders'),
      'getNotificationPermissionStatus',
    ).mockResolvedValue('unavailable');
  });

  afterEach(() => {
    statusSpy.mockRestore();
  });

  it('shows the Expo Go unavailable banner', async () => {
    render(<RemindersSection />);
    await waitFor(() =>
      expect(screen.getByText(/not available in Expo Go/)).toBeTruthy(),
    );
  });

  it('does not schedule anything when switches are toggled while unavailable', async () => {
    render(<RemindersSection />);
    await waitFor(() =>
      expect(screen.getByText(/not available in Expo Go/)).toBeTruthy(),
    );
    fireEvent(screen.getAllByRole('switch')[0], 'onValueChange', true);
    await waitFor(() => expect(mockSchedule).not.toHaveBeenCalled());
  });
});

describe('RemindersSection — denied', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPerms.mockResolvedValue({ granted: false, canAskAgain: false });
    mockReqPerms.mockResolvedValue({ granted: false, canAskAgain: false });
  });

  it('shows the "open Settings" banner instead of an Alert', async () => {
    render(<RemindersSection />);
    await waitFor(() =>
      expect(screen.getByLabelText('Open notification settings')).toBeTruthy(),
    );
  });

  it('does not schedule anything when permission is denied', async () => {
    render(<RemindersSection />);
    // Wait for denied status to propagate
    await waitFor(() =>
      expect(screen.getByLabelText('Open notification settings')).toBeTruthy(),
    );
    fireEvent(screen.getAllByRole('switch')[0], 'onValueChange', true);
    await waitFor(() => expect(mockSchedule).not.toHaveBeenCalled());
  });
});
