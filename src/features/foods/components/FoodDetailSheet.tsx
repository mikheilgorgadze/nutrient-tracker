import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { NumberInput } from '@/components/NumberInput';
import { MacroBadge } from '@/components/MacroBadge';
import { macrosForServings } from '@/lib/algorithms/macros';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow, MealSlot } from '@/lib/db/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FoodDetailSheetProps {
  food: FoodRow | null;
  mealSlot: MealSlot;
  onClose: () => void;
  onAdd: (food: FoodRow, servings: number, mealSlot: MealSlot) => void;
}

export function FoodDetailSheet({ food, mealSlot, onClose, onAdd }: FoodDetailSheetProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>{food.name}</Text>
        </View>

        <View style={styles.content}>
          {food.brand ? <Text style={styles.brand}>{food.brand}</Text> : null}

          <View style={styles.servingRow}>
            <Text style={styles.label}>Servings</Text>
            <View style={styles.quickServe}>
              {[0.5, 1, 2].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.quickBtn, Math.abs(servings - n) < 0.01 && styles.quickBtnActive]}
                  onPress={() => setServings(n)}
                  accessibilityRole="button"
                  accessibilityLabel={`${n === 0.5 ? 'half' : n} serving${n !== 1 ? 's' : ''}`}
                >
                  <Text style={[styles.quickBtnText, Math.abs(servings - n) < 0.01 && styles.quickBtnTextActive]}>
                    {n === 0.5 ? '½×' : `${n}×`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <View style={styles.previewRight}>
              <View style={styles.macroChips}>
                <MacroBadge type="protein" value={preview.protein_g} />
                <MacroBadge type="carbs" value={preview.carbs_g} />
                <MacroBadge type="fat" value={preview.fat_g} />
              </View>
              {(food.fiber_g != null || food.sugar_g != null || food.sodium_mg != null) && (
                <View style={styles.extraNutrients}>
                  {food.fiber_g != null && (
                    <Text style={styles.extraNutrientText}>Fiber {(food.fiber_g * servings).toFixed(1)}g</Text>
                  )}
                  {food.sugar_g != null && (
                    <Text style={styles.extraNutrientText}>Sugar {(food.sugar_g * servings).toFixed(1)}g</Text>
                  )}
                  {food.sodium_mg != null && (
                    <Text style={styles.extraNutrientText}>Sodium {Math.round(food.sodium_mg * servings)}mg</Text>
                  )}
                </View>
              )}
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
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  keyboardAvoiding: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
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
  previewRight: {
    flex: 1,
    gap: spacing.xs,
  },
  macroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  extraNutrients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  extraNutrientText: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
  },
  quickServe: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  quickBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  quickBtnTextActive: {
    color: colors.background,
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
