import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

interface FoodLogRowProps {
  name: string;
  brand?: string | null;
  servings: number;
  servingLabel: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  onDelete: () => void;
  onPress?: () => void;
}

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  }
  return (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={handleDelete}
      accessibilityLabel="Delete entry"
      accessibilityRole="button"
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );
}

export function FoodLogRow({
  name,
  brand,
  servings,
  servingLabel,
  kcal,
  protein_g,
  carbs_g,
  fat_g,
  onDelete,
  onPress,
}: FoodLogRowProps) {
  return (
    <Swipeable
      renderRightActions={() => <DeleteAction onDelete={onDelete} />}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${Math.round(kcal)} calories`}
      >
        <View style={styles.thumbnail}>
          <Ionicons name="restaurant-outline" size={18} color={colors.textTertiary} />
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {brand && <Text style={styles.brand} numberOfLines={1}>{brand}</Text>}
          <Text style={styles.serving} numberOfLines={1}>
            {servings === 1
              ? servingLabel
              : `${servings} × ${servingLabel}`}
          </Text>
        </View>

        <View style={styles.macros}>
          <Text style={styles.kcal}>{Math.round(kcal)}</Text>
          <Text style={styles.kcalUnit}>kcal</Text>
          <View style={styles.macroRow}>
            <Text style={[styles.macroVal, { color: colors.protein }]}>{Math.round(protein_g)}P</Text>
            <Text style={[styles.macroVal, { color: colors.carbs }]}>{Math.round(carbs_g)}C</Text>
            <Text style={[styles.macroVal, { color: colors.fat }]}>{Math.round(fat_g)}F</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
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
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
