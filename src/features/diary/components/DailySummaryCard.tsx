import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { MacroTotals } from '@/lib/db/types';

interface Props {
  date: string;
  totals: MacroTotals;
  targets: MacroTotals;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function MacroBar({ label, value, target, color }: {
  label: string; value: number; target: number; color: string;
}) {
  const colors = useColors();
  const bar = makeBarStyles(colors);
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <View style={bar.row}>
      <View style={bar.labelRow}>
        <Text style={bar.label}>{label}</Text>
        <Text style={[bar.value, { color }]}>{Math.round(value)}g</Text>
      </View>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export const DailySummaryCard = forwardRef<View, Props>(function DailySummaryCard(
  { date, totals, targets },
  ref,
) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const remaining = Math.round(targets.kcal - totals.kcal);
  const isOver = remaining < 0;

  return (
    <View ref={ref} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.appName}>NutrientTracker</Text>
        <Text style={styles.date}>{formatDate(date)}</Text>
      </View>

      <View style={styles.kcalRow}>
        <Text style={styles.kcalValue}>{Math.round(totals.kcal)}</Text>
        <Text style={styles.kcalUnit}> kcal</Text>
        <View style={styles.budgetChip}>
          <Text style={[styles.budgetText, { color: isOver ? colors.danger : colors.accent }]}>
            {isOver ? `+${Math.abs(remaining)} over` : `${remaining} left`}
          </Text>
        </View>
      </View>

      <View style={styles.macros}>
        <MacroBar label="Protein" value={totals.protein_g} target={targets.protein_g} color={colors.protein} />
        <MacroBar label="Carbs"   value={totals.carbs_g}   target={targets.carbs_g}   color={colors.carbs} />
        <MacroBar label="Fat"     value={totals.fat_g}     target={targets.fat_g}     color={colors.fat} />
      </View>

      <Text style={styles.footer}>Fully offline · Built with love</Text>
    </View>
  );
});

const makeBarStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  row: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.textSecondary, fontSize: fontSize.xs },
  value: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  track: { height: 4, borderRadius: borderRadius.full, backgroundColor: '#2A2A2A', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: borderRadius.full },
});

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: '#161616',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  date: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  kcalValue: {
    color: colors.textPrimary,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.hero * 1.1,
  },
  kcalUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  },
  budgetChip: {
    marginLeft: 'auto',
    backgroundColor: '#222',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  budgetText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  macros: {
    gap: spacing.sm,
  },
  footer: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
