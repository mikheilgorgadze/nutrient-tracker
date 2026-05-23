import type * as NotificationsType from 'expo-notifications';

// Loaded lazily — expo-notifications throws on import in Expo Go (Android, SDK 53+).
// eslint-disable-next-line @typescript-eslint/no-require-imports
let N: typeof NotificationsType | null = (() => { try { return require('expo-notifications'); } catch { return null; } })();

export type MealReminder = {
  id: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  label: string;
  defaultHour: number;
  defaultMinute: number;
};

export const MEAL_REMINDERS: MealReminder[] = [
  { id: 'breakfast', label: 'Breakfast',  defaultHour: 8,  defaultMinute: 0 },
  { id: 'lunch',     label: 'Lunch',      defaultHour: 12, defaultMinute: 30 },
  { id: 'dinner',    label: 'Dinner',     defaultHour: 19, defaultMinute: 0 },
  { id: 'snacks',    label: 'Snacks',     defaultHour: 15, defaultMinute: 0 },
];

export type ReminderSetting = {
  enabled: boolean;
  hour: number;
  minute: number;
};

/** Request permission, returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!N) return false;
  const result = await N.requestPermissionsAsync() as { granted: boolean };
  return result.granted;
}

/** Check current permission status without prompting. */
export async function getNotificationPermissionStatus(): Promise<string> {
  if (!N) return 'unavailable';
  const result = await N.getPermissionsAsync() as { granted: boolean; canAskAgain: boolean };
  return result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied';
}

/** Schedule (or reschedule) a daily meal reminder. Cancels existing one first. */
export async function scheduleReminder(
  meal: MealReminder,
  setting: ReminderSetting,
): Promise<string | null> {
  await cancelReminder(meal.id);

  if (!setting.enabled || !N) return null;

  const id = await N.scheduleNotificationAsync({
    identifier: `reminder_${meal.id}`,
    content: {
      title: `Time to log ${meal.label}`,
      body: 'Tap to open NutrientTracker and log your meal.',
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: setting.hour,
      minute: setting.minute,
    },
  });

  return id;
}

/** Cancel a meal reminder by meal id. */
export async function cancelReminder(mealId: string): Promise<void> {
  if (!N) return;
  await N.cancelScheduledNotificationAsync(`reminder_${mealId}`);
}

/** Cancel all meal reminders. */
export async function cancelAllReminders(): Promise<void> {
  for (const meal of MEAL_REMINDERS) {
    await cancelReminder(meal.id);
  }
}
