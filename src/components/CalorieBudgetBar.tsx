import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

interface CalorieBudgetBarProps {
  kcal: number;
  kcalTarget: number;
  /** Whether to show numeric label, default true */
  showLabel?: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function CalorieBudgetBar({ kcal, kcalTarget, showLabel = true }: CalorieBudgetBarProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const progress = kcalTarget > 0 ? clamp(kcal / kcalTarget, 0, 1) : 0;
  const pct = kcalTarget > 0 ? kcal / kcalTarget : 0;

  const barColor =
    pct >= 1.0
      ? colors.danger
      : pct >= 0.9
      ? colors.warning
      : colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: barColor },
          ]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: kcalTarget, now: kcal }}
        />
      </View>
      {showLabel && (
        <Text style={styles.label} numberOfLines={1}>
          {Math.round(kcal)} / {Math.round(kcalTarget)} kcal
        </Text>
      )}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});
