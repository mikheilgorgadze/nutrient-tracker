import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MEAL_REMINDERS,
  ReminderSetting,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleReminder,
  cancelReminder,
} from '@/lib/notifications/reminders';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

type PermissionStatus = 'unknown' | 'unavailable' | 'undetermined' | 'denied' | 'granted';
type Settings = Record<string, ReminderSetting>;

const DEFAULT_SETTINGS: Settings = Object.fromEntries(
  MEAL_REMINDERS.map(m => [
    m.id,
    { enabled: false, hour: m.defaultHour, minute: m.defaultMinute },
  ]),
);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${pad(minute)} ${period}`;
}

export function RemindersSection() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [permStatus, setPermStatus] = useState<PermissionStatus>('unknown');

  useEffect(() => {
    getNotificationPermissionStatus().then(s => setPermStatus(s as PermissionStatus));
  }, []);

  async function ensurePermission(): Promise<boolean> {
    if (permStatus === 'granted') return true;
    if (permStatus === 'unavailable') return false;

    const granted = await requestNotificationPermission();
    setPermStatus(granted ? 'granted' : 'denied');
    return granted;
  }

  async function handleToggle(mealId: string, value: boolean) {
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
    }

    const meal = MEAL_REMINDERS.find(m => m.id === mealId)!;
    const updated = { ...settings[mealId], enabled: value };
    setSettings(prev => ({ ...prev, [mealId]: updated }));

    if (value) {
      await scheduleReminder(meal, updated);
    } else {
      await cancelReminder(mealId);
    }
  }

  const switchesDisabled = permStatus === 'unavailable' || permStatus === 'denied';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Meal Reminders</Text>
      <Text style={styles.sectionSubtitle}>
        Get daily notifications to log your meals on time.
      </Text>

      {permStatus === 'unavailable' && (
        <View style={styles.noticeBanner} accessibilityRole="none">
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noticeText}>
            Reminders require a development build — not available in Expo Go.
          </Text>
        </View>
      )}

      {permStatus === 'denied' && (
        <TouchableOpacity
          style={styles.noticeBanner}
          onPress={() => Linking.openSettings()}
          accessibilityRole="button"
          accessibilityLabel="Open notification settings"
        >
          <Ionicons name="notifications-off-outline" size={16} color={colors.warning} />
          <Text style={[styles.noticeText, styles.noticeLink]}>
            Notifications are off — tap to open Settings
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.warning} />
        </TouchableOpacity>
      )}

      {MEAL_REMINDERS.map(meal => {
        const setting = settings[meal.id];
        return (
          <View key={meal.id} style={[styles.row, switchesDisabled && styles.rowDisabled]}>
            <Ionicons
              name={meal.id === 'breakfast' ? 'sunny-outline'
                  : meal.id === 'lunch' ? 'partly-sunny-outline'
                  : meal.id === 'dinner' ? 'moon-outline'
                  : 'cafe-outline'}
              size={18}
              color={setting.enabled ? colors.accent : colors.textTertiary}
            />
            <Text style={[styles.mealLabel, switchesDisabled && styles.mealLabelDisabled]}>
              {meal.label}
            </Text>

            {setting.enabled && (
              <View style={styles.timeChip}>
                <Text style={styles.timeText}>
                  {formatTime(setting.hour, setting.minute)}
                </Text>
              </View>
            )}

            <Switch
              value={setting.enabled}
              onValueChange={v => handleToggle(meal.id, v)}
              disabled={switchesDisabled}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
              accessibilityLabel={`Toggle ${meal.label} reminder`}
            />
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  noticeLink: {
    color: colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  mealLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  mealLabelDisabled: {
    color: colors.textSecondary,
  },
  timeChip: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
