import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { NumberInput } from '@/components/NumberInput';
import { useFoodMutations } from '../hooks/useFoodMutations';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow } from '@/lib/db/types';

interface EditFoodModalProps {
  food: FoodRow | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  brand: string;
  serving_label: string;
  serving_size_g: number;
  kcal_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function foodToForm(food: FoodRow): FormValues {
  return {
    name: food.name,
    brand: food.brand ?? '',
    serving_label: food.serving_label,
    serving_size_g: food.serving_size_g,
    kcal_per_serving: food.kcal_per_serving,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
  };
}

function validate(v: FormValues): string | null {
  if (!v.name.trim()) return 'Name is required';
  if (!v.serving_label.trim()) return 'Serving label is required';
  if (v.serving_size_g <= 0) return 'Serving size must be greater than 0';
  return null;
}

export function EditFoodModal({ food, onClose }: EditFoodModalProps) {
  const [form, setForm] = useState<FormValues>(() =>
    food ? foodToForm(food) : foodToForm({
      id: '', name: '', brand: null, serving_label: '1 serving', serving_size_g: 100,
      kcal_per_serving: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
      fiber_g: null, sugar_g: null, sodium_mg: null, barcode: null, is_custom: 1, created_at: 0,
    })
  );
  const [error, setError] = useState<string | null>(null);
  const { editFood, removeFood } = useFoodMutations();

  // Sync form when food changes (modal opens with a different food)
  const [lastFoodId, setLastFoodId] = useState<string | null>(null);
  if (food && food.id !== lastFoodId) {
    setLastFoodId(food.id);
    setForm(foodToForm(food));
    setError(null);
  }

  if (!food) return null;

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }
    setError(null);
    editFood.mutate(
      {
        id: food!.id,
        fields: {
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          serving_label: form.serving_label.trim(),
          serving_size_g: form.serving_size_g,
          kcal_per_serving: form.kcal_per_serving,
          protein_g: form.protein_g,
          carbs_g: form.carbs_g,
          fat_g: form.fat_g,
        },
      },
      { onSuccess: onClose },
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete Food',
      `Delete "${food!.name}"? Any diary entries using this food will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeFood.mutate(food!.id, { onSuccess: onClose }),
        },
      ],
    );
  }

  const isBusy = editFood.isPending || removeFood.isPending;

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Food</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerBtn}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="Save food"
          >
            <Text style={[styles.headerSave, isBusy && styles.headerSaveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <SectionLabel>Identity</SectionLabel>
          <FieldGroup label="Name *">
            <TextInput style={styles.textInput} value={form.name} onChangeText={v => set('name', v)}
              placeholder="e.g. Greek Yogurt" placeholderTextColor={colors.textTertiary} selectionColor={colors.accent} />
          </FieldGroup>
          <FieldGroup label="Brand (optional)">
            <TextInput style={styles.textInput} value={form.brand} onChangeText={v => set('brand', v)}
              placeholder="e.g. Chobani" placeholderTextColor={colors.textTertiary} selectionColor={colors.accent} />
          </FieldGroup>

          <SectionLabel>Serving</SectionLabel>
          <FieldGroup label="Serving label *">
            <TextInput style={styles.textInput} value={form.serving_label} onChangeText={v => set('serving_label', v)}
              placeholder="e.g. 1 cup, 100g, 1 slice" placeholderTextColor={colors.textTertiary} selectionColor={colors.accent} />
          </FieldGroup>
          <FieldGroup label="Serving size (grams) *">
            <NumberInput value={form.serving_size_g} onChangeValue={v => set('serving_size_g', v)} suffix="g" min={0.1} max={9999} />
          </FieldGroup>

          <SectionLabel>Nutrition per serving</SectionLabel>
          <FieldGroup label="Calories">
            <NumberInput value={form.kcal_per_serving} onChangeValue={v => set('kcal_per_serving', v)} suffix="kcal" min={0} max={9999} />
          </FieldGroup>
          <FieldGroup label="Protein">
            <NumberInput value={form.protein_g} onChangeValue={v => set('protein_g', v)} suffix="g" min={0} max={999} />
          </FieldGroup>
          <FieldGroup label="Carbohydrates">
            <NumberInput value={form.carbs_g} onChangeValue={v => set('carbs_g', v)} suffix="g" min={0} max={999} />
          </FieldGroup>
          <FieldGroup label="Fat">
            <NumberInput value={form.fat_g} onChangeValue={v => set('fat_g', v)} suffix="g" min={0} max={999} />
          </FieldGroup>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="Delete food"
          >
            <Text style={styles.deleteBtnText}>Delete Food</Text>
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { color: colors.textPrimary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  headerCancel: { color: colors.textSecondary, fontSize: fontSize.base },
  headerSave: { color: colors.accent, fontSize: fontSize.base, fontWeight: fontWeight.semibold, textAlign: 'right' },
  headerSaveDisabled: { opacity: 0.4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
  },
  fieldGroup: { gap: spacing.xs },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  deleteBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: spacing.lg,
  },
  deleteBtnText: { color: colors.danger, fontSize: fontSize.base, fontWeight: fontWeight.medium },
});
