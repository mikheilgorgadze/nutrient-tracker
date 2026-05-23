import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

type MacroType = 'protein' | 'carbs' | 'fat';

interface MacroBadgeProps {
  type: MacroType;
  value: number;
  unit?: string;
}

const MACRO_LABELS: Record<MacroType, string> = {
  protein: 'P',
  carbs: 'C',
  fat: 'F',
};

export function MacroBadge({ type, value, unit = 'g' }: MacroBadgeProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const macroColors: Record<MacroType, string> = {
    protein: colors.protein,
    carbs: colors.carbs,
    fat: colors.fat,
  };
  const color = macroColors[type];
  return (
    <View style={[styles.container, { backgroundColor: color + '22' }]}>
      <Text style={[styles.label, { color }]}>{MACRO_LABELS[type]}</Text>
      <Text style={[styles.value, { color }]}>
        {Math.round(value)}
        {unit}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    gap: spacing.xs / 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  value: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
});
