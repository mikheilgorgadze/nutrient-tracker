import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WeightChart } from '../components/WeightChart';
import { TdeeCard } from '../components/TdeeCard';
import { CalorieChart } from '../components/CalorieChart';
import { WeightEntrySheet } from '../components/WeightEntrySheet';
import { useWeightLog } from '../hooks/useWeightLog';
import { useTdeeEstimate } from '../hooks/useTdeeEstimate';
import { useWeightMutations } from '../hooks/useWeightMutations';
import { useCalorieHistory, avgKcalExcludingZero } from '../hooks/useCalorieHistory';
import { useStreak } from '../hooks/useStreak';
import { today } from '@/lib/db';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import { mifflinBMR, baselineTDEE } from '@/lib/algorithms/tdee';
import { dailyTargets } from '@/lib/algorithms/targets';
import { useDb } from '@/hooks/useDb';
import { getGoals } from '@/lib/db/queries/goals';

const WINDOW_OPTIONS = [30, 90, 180] as const;
type WindowDays = typeof WINDOW_OPTIONS[number];

const DEFAULT_KCAL_TARGET = 2000;

export function ProgressScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [windowDays, setWindowDays] = useState<WindowDays>(90);
  const [entrySheetOpen, setEntrySheetOpen] = useState(false);

  const db = useDb();
  const { data: weightData, isLoading: weightLoading } = useWeightLog(windowDays);
  const { data: tdeeData, isLoading: tdeeLoading } = useTdeeEstimate();
  const { logWeight } = useWeightMutations();
  const { data: calorieHistory } = useCalorieHistory(7);
  const streak = useStreak();

  const isLoading = weightLoading || tdeeLoading;
  const loggedToday = weightData?.dates.includes(today()) ?? false;

  // Derive calorie target the same way useDiary does
  const kcalTarget = React.useMemo((): number => {
    if (!db) return DEFAULT_KCAL_TARGET;
    try {
      const goals = getGoals(db);
      if (!goals) return DEFAULT_KCAL_TARGET;
      const bmr = mifflinBMR({
        sex: goals.sex,
        age: goals.age_years,
        height_cm: goals.height_cm,
        weight_kg: goals.weight_kg,
      });
      const tdee = tdeeData?.estimatedTdee ?? baselineTDEE(bmr, goals.activity_level);
      return dailyTargets(
        tdee,
        { goalType: goals.goal_type, weeklyRateKg: goals.weekly_rate_kg },
        goals.weight_kg,
      ).kcal;
    } catch {
      return DEFAULT_KCAL_TARGET;
    }
  }, [db, tdeeData]);

  const sevenDayAvg = avgKcalExcludingZero(calorieHistory);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Progress</Text>
        {streak > 0 && (
          <View style={styles.streakBadge} accessibilityLabel={`${streak} day streak`}>
            <Text style={styles.streakText}>{'🔥'} {streak}d</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.logWeightBtn, loggedToday && styles.logWeightBtnLogged]}
          onPress={() => setEntrySheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={loggedToday ? "Update today's weight" : "Log today's weight"}
        >
          <Ionicons name={loggedToday ? 'checkmark' : 'add'} size={18} color={loggedToday ? colors.accent : colors.background} />
          <Text style={[styles.logWeightBtnText, loggedToday && styles.logWeightBtnTextLogged]}>
            {loggedToday ? 'Logged today' : 'Log weight'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* TDEE card */}
        {tdeeLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : tdeeData ? (
          <>
            <TdeeCard data={tdeeData} />
            {!tdeeData.latestRow && (
              <View style={styles.tip}>
                <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
                <Text style={styles.tipText}>
                  Log your weight consistently for 2+ weeks to get an adaptive estimate based on your actual data.
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Calorie bar chart */}
        {calorieHistory.length > 0 && (
          <View>
            <CalorieChart
              dates={calorieHistory.map(e => e.date)}
              kcals={calorieHistory.map(e => e.kcal)}
              target={kcalTarget}
              width={width - spacing.md * 2}
              height={180}
            />
            {sevenDayAvg > 0 && (
              <Text style={styles.avgKcalText}>
                {'7-day avg  ·  '}{sevenDayAvg.toLocaleString()}{' kcal'}
              </Text>
            )}
          </View>
        )}

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weight</Text>
          <View style={styles.windowPicker}>
            {WINDOW_OPTIONS.map(days => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.windowBtn,
                  windowDays === days && styles.windowBtnActive,
                ]}
                onPress={() => setWindowDays(days)}
                accessibilityRole="button"
                accessibilityLabel={`${days} day window`}
              >
                <Text style={[
                  styles.windowBtnText,
                  windowDays === days && styles.windowBtnTextActive,
                ]}>
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart */}
        {weightLoading ? (
          <View style={styles.chartPlaceholder}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <WeightChart
              dates={weightData?.dates ?? []}
              rawWeights={weightData?.rawWeights ?? []}
              smoothedWeights={weightData?.smoothedWeights ?? []}
              width={width - spacing.md * 2}
              height={220}
            />
          </View>
        )}

      </ScrollView>

      <WeightEntrySheet
        visible={entrySheetOpen}
        onClose={() => setEntrySheetOpen(false)}
        onSave={(date, weight_kg) => logWeight.mutate({ date, weight_kg })}
        initialWeight={weightData?.rawWeights.at(-1) ?? 70}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  logWeightBtnLogged: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  logWeightBtnText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  logWeightBtnTextLogged: {
    color: colors.accent,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingCard: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  windowPicker: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  windowBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
  },
  windowBtnActive: {
    backgroundColor: colors.accent,
  },
  windowBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  windowBtnTextActive: {
    color: colors.background,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tipText: {
    flex: 1,
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  chartPlaceholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
  },
  avgKcalText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  streakBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  streakText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
