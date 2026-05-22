import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { NumberInput } from '@/components/NumberInput';
import { useDb } from '@/hooks/useDb';
import { insertFood } from '@/lib/db/queries/foods';
import { insertDiaryEntry } from '@/lib/db/queries/diary';
import { newId, today } from '@/lib/db';
import { useDiaryStore } from '@/store/diaryStore';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodEstimate } from '@/lib/ai/schema';

interface EstimateReviewSheetProps {
  estimate: FoodEstimate | null;
  visible: boolean;
  onClose: () => void;
}

export function EstimateReviewSheet({ estimate, visible, onClose }: EstimateReviewSheetProps) {
  const db = useDb();
  const { activeMealSlot, activeDate } = useDiaryStore();
  const queryClient = useQueryClient();

  // All fields are editable
  const [name, setNameState] = useState('');
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [added, setAdded] = useState(false);

  // Sync estimate → form state when estimate changes
  React.useEffect(() => {
    if (estimate) {
      setNameState(estimate.name);
      setKcal(estimate.kcal);
      setProtein(estimate.protein_g);
      setCarbs(estimate.carbs_g);
      setFat(estimate.fat_g);
      setAdded(false);
    }
  }, [estimate]);

  if (!estimate) return null;

  function handleAdd() {
    if (!db || added) return;

    const foodId = newId();
    const entryId = newId();

    // Insert custom food + diary entry in a single transaction
    db.withTransactionSync(() => {
      insertFood(db!, {
        id: foodId,
        name,
        brand: null,
        serving_size_g: estimate!.estimated_weight_g,
        serving_label: estimate!.serving_description,
        kcal_per_serving: kcal,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        fiber_g: null,
        sugar_g: null,
        sodium_mg: null,
        barcode: null,
        is_custom: 1,
      });

      insertDiaryEntry(db!, {
        id: entryId,
        food_id: foodId,
        date: activeDate ?? today(),
        meal_slot: activeMealSlot,
        servings: 1,
        kcal,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
      });
    });

    queryClient.invalidateQueries({ queryKey: ['diary'] });
    setAdded(true);
    onClose();
  }

  const confidenceColor =
    estimate.confidence === 'high'
      ? colors.accent
      : estimate.confidence === 'medium'
      ? colors.warning
      : colors.danger;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Review Estimate">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Confidence badge */}
        <View style={styles.confidenceRow}>
          <Text style={[styles.confidence, { color: confidenceColor }]}>
            {estimate.confidence.charAt(0).toUpperCase() + estimate.confidence.slice(1)} confidence
          </Text>
          {estimate.notes && (
            <Text style={styles.notes}>{estimate.notes}</Text>
          )}
        </View>

        {/* Editable fields */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Food name</Text>
          <Text style={styles.fieldValue}>{name}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Calories</Text>
          <NumberInput value={kcal} onChangeValue={setKcal} suffix="kcal" min={0} max={9999} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Protein</Text>
          <NumberInput value={protein} onChangeValue={setProtein} suffix="g" min={0} max={999} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Carbs</Text>
          <NumberInput value={carbs} onChangeValue={setCarbs} suffix="g" min={0} max={999} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Fat</Text>
          <NumberInput value={fat} onChangeValue={setFat} suffix="g" min={0} max={999} />
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="Add to diary"
        >
          <Text style={styles.addBtnText}>Add to Diary</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  confidenceRow: {
    gap: spacing.xs,
  },
  confidence: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
