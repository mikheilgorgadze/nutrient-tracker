import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MacroRing } from '@/components/MacroRing';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import { today } from '@/lib/db';
import type { MacroTotals } from '@/lib/db/types';
import type { MacroTargets } from '@/lib/algorithms/targets';

interface DiaryHeaderProps {
  date: string;
  totals: MacroTotals;
  targets: MacroTargets;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToToday?: () => void;
  latestWeight?: number;
}

function localYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  if (dateStr === today()) return 'Today';
  if (dateStr === localYesterday()) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function DiaryHeader({ date, totals, targets, onPrevDay, onNextDay, onGoToToday, latestWeight }: DiaryHeaderProps) {
  const insets = useSafeAreaInsets();
  const isToday = date === today();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {/* Date navigation */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          onPress={onPrevDay}
          style={styles.navBtn}
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <TouchableOpacity
          onPress={onNextDay}
          style={[styles.navBtn, isToday && styles.navBtnDisabled]}
          accessibilityLabel="Next day"
          accessibilityRole="button"
          disabled={isToday}
        >
          <Ionicons name="chevron-forward" size={22} color={isToday ? colors.textTertiary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isToday && onGoToToday && (
        <TouchableOpacity
          style={styles.todayBtn}
          onPress={onGoToToday}
          accessibilityRole="button"
          accessibilityLabel="Go to today"
        >
          <Text style={styles.todayBtnText}>Go to today</Text>
        </TouchableOpacity>
      )}

      {/* Macro ring */}
      <View style={styles.ringContainer}>
        <MacroRing
          kcal={totals.kcal}
          kcalTarget={targets.kcal}
          protein_g={totals.protein_g}
          carbs_g={totals.carbs_g}
          fat_g={totals.fat_g}
          proteinTarget_g={targets.protein_g}
          carbsTarget_g={targets.carbs_g}
          fatTarget_g={targets.fat_g}
          size={148}
        />
      </View>

      {/* Macro row summary */}
      <View style={styles.macroRow}>
        <MacroStat label="Protein" value={totals.protein_g} target={targets.protein_g} color={colors.protein} />
        <MacroStat label="Carbs"   value={totals.carbs_g}   target={targets.carbs_g}   color={colors.carbs} />
        <MacroStat label="Fat"     value={totals.fat_g}     target={targets.fat_g}     color={colors.fat} />
      </View>

      {latestWeight !== undefined && (
        <View style={styles.weightRow}>
          <Ionicons name="scale-outline" size={13} color={colors.textTertiary} />
          <Text style={styles.weightText}>{latestWeight.toFixed(1)} kg</Text>
        </View>
      )}
    </View>
  );
}

function MacroStat({
  label, value, target, color,
}: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{Math.round(value)}g</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statTarget}>/ {Math.round(target)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  navBtn: {
    padding: spacing.sm,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  todayBtn: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayBtnText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    minWidth: 100,
    textAlign: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  weightText: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  statTarget: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
});
