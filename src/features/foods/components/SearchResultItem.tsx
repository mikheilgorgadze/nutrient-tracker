import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow } from '@/lib/db/types';

interface SearchResultItemProps {
  food: FoodRow;
  onPress: (food: FoodRow) => void;
}

export function SearchResultItem({ food, onPress }: SearchResultItemProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(food)}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}${food.brand ? `, ${food.brand}` : ''}, ${Math.round(food.kcal_per_serving)} calories per ${food.serving_label}`}
    >
      <View style={styles.thumbnail}>
        <Ionicons name="restaurant-outline" size={18} color={colors.textTertiary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{food.name}</Text>
        {food.brand && <Text style={styles.brand} numberOfLines={1}>{food.brand}</Text>}
        <Text style={styles.serving} numberOfLines={1}>{food.serving_label}</Text>
      </View>
      <View style={styles.macros}>
        <Text style={styles.kcal}>{Math.round(food.kcal_per_serving)}</Text>
        <Text style={styles.kcalUnit}>kcal</Text>
        <View style={styles.macroRow}>
          <Text style={[styles.macroVal, { color: colors.protein }]}>{Math.round(food.protein_g)}P</Text>
          <Text style={[styles.macroVal, { color: colors.carbs }]}>{Math.round(food.carbs_g)}C</Text>
          <Text style={[styles.macroVal, { color: colors.fat }]}>{Math.round(food.fat_g)}F</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  brand: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  serving: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
  macros: {
    alignItems: 'flex-end',
    gap: 2,
  },
  kcal: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  kcalUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  macroVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
});
