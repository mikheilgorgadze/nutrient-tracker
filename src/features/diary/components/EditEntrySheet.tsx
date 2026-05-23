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
import * as Haptics from 'expo-haptics';
import { NumberInput } from '@/components/NumberInput';
import { MacroBadge } from '@/components/MacroBadge';
import { macrosForServings } from '@/lib/algorithms/macros';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { DiaryEntryWithFood, MealSlot } from '@/lib/db/types';

const MEAL_SLOTS: { value: MealSlot; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditEntrySheetProps {
  entry: DiaryEntryWithFood | null;
  onClose: () => void;
  onUpdate: (entryId: string, servings: number, food: DiaryEntryWithFood['food'], mealSlot: MealSlot) => void;
  onDelete: (entryId: string) => void;
  onCopyToToday?: (food: DiaryEntryWithFood['food'], servings: number, mealSlot: MealSlot) => void;
}

export function EditEntrySheet({ entry, onClose, onUpdate, onDelete, onCopyToToday }: EditEntrySheetProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [servings, setServings] = useState(1);
  const [mealSlot, setMealSlot] = useState<MealSlot>('breakfast');
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (entry) {
      setServings(entry.servings);
      setMealSlot(entry.meal_slot);
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!entry) return null;

  const preview = macrosForServings(entry.food, servings);

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>{entry.food.name}</Text>
        </View>

        <View style={styles.content}>
          {entry.food.brand ? <Text style={styles.brand}>{entry.food.brand}</Text> : null}

          <View style={styles.servingRow}>
            <Text style={styles.label}>Meal</Text>
            <View style={styles.slotRow}>
              {MEAL_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot.value}
                  style={[styles.slotChip, mealSlot === slot.value && styles.slotChipActive]}
                  onPress={() => setMealSlot(slot.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mealSlot === slot.value }}
                  accessibilityLabel={slot.label}
                >
                  <Text style={[styles.slotChipText, mealSlot === slot.value && styles.slotChipTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.servingRow}>
            <Text style={styles.label}>Servings</Text>
            <NumberInput
              value={servings}
              onChangeValue={setServings}
              suffix={entry.food.serving_label}
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
            style={styles.updateBtn}
            onPress={() => {
              onUpdate(entry.id, servings, entry.food, mealSlot);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Update servings"
          >
            <Text style={styles.updateBtnText}>Update Servings</Text>
          </TouchableOpacity>

          {onCopyToToday && (
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                onCopyToToday(entry.food, servings, mealSlot);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Copy to today"
            >
              <Text style={styles.copyBtnText}>Copy to Today</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete(entry.id);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete entry"
          >
            <Text style={styles.deleteBtnText}>Delete Entry</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
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
  slotRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  slotChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  slotChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  slotChipTextActive: {
    color: colors.background,
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
  updateBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  updateBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  copyBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  copyBtnText: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  deleteBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
