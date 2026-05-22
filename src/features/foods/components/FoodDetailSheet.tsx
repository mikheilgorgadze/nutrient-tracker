import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { NumberInput } from '@/components/NumberInput';
import { MacroBadge } from '@/components/MacroBadge';
import { macrosForServings } from '@/lib/algorithms/macros';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow, MealSlot } from '@/lib/db/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FoodDetailSheetProps {
  food: FoodRow | null;
  mealSlot: MealSlot;
  onClose: () => void;
  onAdd: (food: FoodRow, servings: number, mealSlot: MealSlot) => void;
}

export function FoodDetailSheet({ food, mealSlot, onClose, onAdd }: FoodDetailSheetProps) {
  const [servings, setServings] = useState(1);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (food) {
      setServings(1);
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [food?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!food) return null;

  const preview = macrosForServings(food, servings);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop — tapping it dismisses the sheet */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
      </TouchableWithoutFeedback>

      {/* Sliding panel — anchored to the bottom */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>{food.name}</Text>
        </View>

        <View style={styles.content}>
          {food.brand ? <Text style={styles.brand}>{food.brand}</Text> : null}

          <View style={styles.servingRow}>
            <Text style={styles.label}>Servings</Text>
            <NumberInput
              value={servings}
              onChangeValue={setServings}
              suffix={food.serving_label}
              min={0.1}
              max={99}
            />
          </View>

          <View style={styles.preview}>
            <View style={styles.kcalBlock}>
              <Text style={styles.kcalNum}>{Math.round(preview.kcal)}</Text>
              <Text style={styles.kcalUnit}>kcal</Text>
            </View>
            <View style={styles.macroChips}>
              <MacroBadge type="protein" value={preview.protein_g} />
              <MacroBadge type="carbs" value={preview.carbs_g} />
              <MacroBadge type="fat" value={preview.fat_g} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              onAdd(food, servings, mealSlot);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${food.name} to ${mealSlot}`}
          >
            <Text style={styles.addBtnText}>
              Add to {mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  brand: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: -spacing.sm,
  },
  servingRow: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  kcalBlock: {
    alignItems: 'center',
    minWidth: 56,
  },
  kcalNum: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  kcalUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  macroChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
