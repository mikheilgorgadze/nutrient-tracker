import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { TdeeData } from '../hooks/useTdeeEstimate';

interface TdeeCardProps {
  data: TdeeData;
}

export function TdeeCard({ data }: TdeeCardProps) {
  const { estimatedTdee, confidence, latestRow } = data;

  const confidenceLabel = confidence === null
    ? 'Estimated (baseline)'
    : confidence < 0.3
    ? 'Low confidence — log more data'
    : confidence < 0.7
    ? 'Moderate confidence'
    : 'High confidence';

  const confidenceColor = confidence === null
    ? colors.textTertiary
    : confidence < 0.3
    ? colors.warning
    : confidence < 0.7
    ? colors.warning
    : colors.accent;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Estimated TDEE</Text>
      <Text style={styles.value}>{estimatedTdee > 0 ? Math.round(estimatedTdee) : '—'}</Text>
      <Text style={styles.unit}>kcal / day</Text>
      <Text style={[styles.confidence, { color: confidenceColor }]}>{confidenceLabel}</Text>

      {latestRow && (
        <Text style={styles.meta}>
          Based on {latestRow.data_points} data points · Week of {latestRow.week_start}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: colors.textPrimary,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  confidence: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
