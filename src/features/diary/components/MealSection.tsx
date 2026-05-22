import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLogRow } from '@/components/FoodLogRow';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { DiarySection } from '../hooks/useDiary';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

interface MealSectionProps {
  section: DiarySection;
  onDeleteEntry: (id: string) => void;
  onPressEntry?: (entryId: string) => void;
  onAddToSlot?: () => void;
}

export function MealSection({
  section,
  onDeleteEntry,
  onPressEntry,
  onAddToSlot,
}: MealSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { slot, entries, subtotal } = section;
  const label = MEAL_LABELS[slot] ?? slot;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(c => !c)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${Math.round(subtotal.kcal)} calories. Tap to ${collapsed ? 'expand' : 'collapse'}`}
      >
        <Text style={styles.slotLabel}>{label}</Text>
        {entries.length > 0 && (
          <Text style={styles.subtotal}>{Math.round(subtotal.kcal)} kcal</Text>
        )}
        <Ionicons
          name={collapsed ? 'chevron-forward' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {/* Entries */}
      {!collapsed && (
        <>
          {entries.map(entry => (
            <FoodLogRow
              key={entry.id}
              name={entry.food.name}
              brand={entry.food.brand}
              servings={entry.servings}
              servingLabel={entry.food.serving_label}
              kcal={entry.kcal}
              protein_g={entry.protein_g}
              carbs_g={entry.carbs_g}
              fat_g={entry.fat_g}
              onDelete={() => onDeleteEntry(entry.id)}
              onPress={() => onPressEntry?.(entry.id)}
            />
          ))}

          {/* Add button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onAddToSlot}
            accessibilityRole="button"
            accessibilityLabel={`Add food to ${label}`}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.addBtnText}>Add food</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  slotLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  subtotal: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontVariant: ['tabular-nums'],
    marginRight: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  addBtnText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
