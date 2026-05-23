import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NumberInput } from '@/components/NumberInput';
import { useFoodMutations } from '../hooks/useFoodMutations';
import { useLabelScan } from '../hooks/useLabelScan';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow } from '@/lib/db/types';

interface CreateFoodModalProps {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  /** Called with the newly created food so the caller can open the detail sheet */
  onCreated: (food: Omit<FoodRow, 'created_at'>) => void;
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

function initialForm(name = ''): FormValues {
  return {
    name,
    brand: '',
    serving_label: '1 serving',
    serving_size_g: 100,
    kcal_per_serving: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };
}

function validate(v: FormValues): string | null {
  if (!v.name.trim()) return 'Name is required';
  if (!v.serving_label.trim()) return 'Serving label is required';
  if (v.serving_size_g <= 0) return 'Serving size must be greater than 0';
  return null;
}

export function CreateFoodModal({ visible, initialName, onClose, onCreated }: CreateFoodModalProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [form, setForm] = useState<FormValues>(() => initialForm(initialName));
  const [error, setError] = useState<string | null>(null);
  const { createFood } = useFoodMutations();
  const { state: scanState, scanLabel, reset: resetScan } = useLabelScan();

  // Re-initialize form when modal opens with a new initialName
  const [lastVisible, setLastVisible] = useState(false);
  if (visible && !lastVisible) {
    setLastVisible(true);
    setForm(initialForm(initialName));
    setError(null);
    resetScan();
  } else if (!visible && lastVisible) {
    setLastVisible(false);
  }

  // Pre-fill form when label scan completes
  useEffect(() => {
    if (scanState.status === 'done') {
      const { label } = scanState;
      setForm({
        name: label.name,
        brand: label.brand ?? '',
        serving_label: label.serving_label,
        serving_size_g: label.serving_size_g,
        kcal_per_serving: label.kcal_per_serving,
        protein_g: label.protein_g,
        carbs_g: label.carbs_g,
        fat_g: label.fat_g,
      });
      setError(null);
    }
    if (scanState.status === 'error') {
      setError(`Scan failed: ${scanState.message}`);
    }
  }, [scanState]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const isScanning = scanState.status === 'picking' || scanState.status === 'scanning';

  function handleSave() {
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    createFood.mutate(
      {
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        serving_label: form.serving_label.trim(),
        serving_size_g: form.serving_size_g,
        kcal_per_serving: form.kcal_per_serving,
        protein_g: form.protein_g,
        carbs_g: form.carbs_g,
        fat_g: form.fat_g,
        fiber_g: null,
        sugar_g: null,
        sodium_mg: null,
        barcode: null,
        is_custom: 1,
      },
      { onSuccess: (food) => { onCreated(food); onClose(); } },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Food</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerBtn}
            disabled={createFood.isPending}
            accessibilityRole="button"
            accessibilityLabel="Save food"
          >
            <Text style={[styles.headerSave, createFood.isPending && styles.headerSaveDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scan label banner */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={scanLabel}
          disabled={isScanning}
          accessibilityRole="button"
          accessibilityLabel="Scan nutrition label"
        >
          {isScanning ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="camera-outline" size={16} color={colors.accent} />
          )}
          <Text style={styles.scanBtnText}>
            {scanState.status === 'done'
              ? 'Label scanned — edit below'
              : isScanning
              ? scanState.status === 'picking' ? 'Selecting photo…' : 'Reading label…'
              : 'Scan nutrition label'}
          </Text>
          {scanState.status === 'done' && (
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
          )}
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <SectionLabel>Identity</SectionLabel>

          <FieldGroup label="Name *">
            <TextInput
              style={styles.textInput}
              value={form.name}
              onChangeText={v => set('name', v)}
              placeholder="e.g. Greek Yogurt"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              autoFocus
              returnKeyType="next"
            />
          </FieldGroup>

          <FieldGroup label="Brand (optional)">
            <TextInput
              style={styles.textInput}
              value={form.brand}
              onChangeText={v => set('brand', v)}
              placeholder="e.g. Chobani"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              returnKeyType="next"
            />
          </FieldGroup>

          <SectionLabel>Serving</SectionLabel>

          <FieldGroup label="Serving label *">
            <TextInput
              style={styles.textInput}
              value={form.serving_label}
              onChangeText={v => set('serving_label', v)}
              placeholder="e.g. 1 cup, 100g, 1 slice"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              returnKeyType="next"
            />
          </FieldGroup>

          <FieldGroup label="Serving size (grams) *">
            <NumberInput
              value={form.serving_size_g}
              onChangeValue={v => set('serving_size_g', v)}
              suffix="g"
              min={0.1}
              max={9999}
            />
          </FieldGroup>

          <SectionLabel>Nutrition per serving</SectionLabel>

          <FieldGroup label="Calories">
            <NumberInput
              value={form.kcal_per_serving}
              onChangeValue={v => set('kcal_per_serving', v)}
              suffix="kcal"
              min={0}
              max={9999}
            />
          </FieldGroup>

          <FieldGroup label="Protein">
            <NumberInput
              value={form.protein_g}
              onChangeValue={v => set('protein_g', v)}
              suffix="g"
              min={0}
              max={999}
            />
          </FieldGroup>

          <FieldGroup label="Carbohydrates">
            <NumberInput
              value={form.carbs_g}
              onChangeValue={v => set('carbs_g', v)}
              suffix="g"
              min={0}
              max={999}
            />
          </FieldGroup>

          <FieldGroup label="Fat">
            <NumberInput
              value={form.fat_g}
              onChangeValue={v => set('fat_g', v)}
              suffix="g"
              min={0}
              max={999}
            />
          </FieldGroup>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
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
  headerBtn: {
    minWidth: 60,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  headerCancel: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  headerSave: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: 'right',
  },
  headerSaveDisabled: {
    opacity: 0.4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  scanBtnText: {
    flex: 1,
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
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
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
