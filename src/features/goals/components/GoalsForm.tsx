import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { NumberInput } from '@/components/NumberInput';
import { MacroBadge } from '@/components/MacroBadge';
import { mifflinBMR, baselineTDEE } from '@/lib/algorithms/tdee';
import { dailyTargets } from '@/lib/algorithms/targets';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { GoalsRow, ActivityLevel, GoalType } from '@/lib/db/types';

type GoalsFormValues = Omit<GoalsRow, 'id' | 'created_at' | 'updated_at'>;

interface GoalsFormProps {
  initialValues?: GoalsFormValues;
  onSubmit: (values: GoalsFormValues) => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitSuccess?: boolean;
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary',   label: 'Sedentary',    description: 'Desk job, little exercise' },
  { value: 'light',       label: 'Light',         description: '1–3 days/week exercise' },
  { value: 'moderate',    label: 'Moderate',      description: '3–5 days/week exercise' },
  { value: 'active',      label: 'Active',        description: '6–7 days/week exercise' },
  { value: 'very_active', label: 'Very active',   description: 'Physical job + hard training' },
];

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'lose',     label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain',     label: 'Gain weight' },
];

const DEFAULT_VALUES: GoalsFormValues = {
  sex: 'male',
  age_years: 30,
  height_cm: 175,
  weight_kg: 75,
  activity_level: 'moderate',
  goal_type: 'maintain',
  weekly_rate_kg: 0,
};

export function GoalsForm({ initialValues, onSubmit, submitLabel = 'Save', submitDisabled, submitSuccess }: GoalsFormProps) {
  const [values, setValues] = useState<GoalsFormValues>(initialValues ?? DEFAULT_VALUES);

  function update<K extends keyof GoalsFormValues>(key: K, value: GoalsFormValues[K]) {
    setValues(v => ({ ...v, [key]: value }));
  }

  // Live preview
  const bmr = mifflinBMR({
    sex: values.sex,
    age: values.age_years,
    height_cm: values.height_cm,
    weight_kg: values.weight_kg,
  });
  const tdee = baselineTDEE(bmr, values.activity_level);
  const targets = dailyTargets(
    tdee,
    { goalType: values.goal_type, weeklyRateKg: values.weekly_rate_kg },
    values.weight_kg,
  );

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Sex */}
      <FieldGroup label="Sex">
        <SegmentPicker
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
          selected={values.sex}
          onSelect={v => update('sex', v as 'male' | 'female')}
        />
      </FieldGroup>

      {/* Age */}
      <FieldGroup label="Age">
        <NumberInput
          value={values.age_years}
          onChangeValue={v => update('age_years', Math.round(v))}
          suffix="years"
          min={10}
          max={120}
        />
      </FieldGroup>

      {/* Height */}
      <FieldGroup label="Height">
        <NumberInput
          value={values.height_cm}
          onChangeValue={v => update('height_cm', Math.round(v))}
          suffix="cm"
          min={100}
          max={250}
        />
      </FieldGroup>

      {/* Weight */}
      <FieldGroup label="Weight">
        <NumberInput
          value={values.weight_kg}
          onChangeValue={v => update('weight_kg', v)}
          suffix="kg"
          min={20}
          max={300}
        />
      </FieldGroup>

      {/* Activity level */}
      <FieldGroup label="Activity level">
        {ACTIVITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionRow, values.activity_level === opt.value && styles.optionRowSelected]}
            onPress={() => update('activity_level', opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: values.activity_level === opt.value }}
          >
            <View style={[styles.radio, values.activity_level === opt.value && styles.radioSelected]} />
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </FieldGroup>

      {/* Goal type */}
      <FieldGroup label="Goal">
        <SegmentPicker
          options={GOAL_OPTIONS}
          selected={values.goal_type}
          onSelect={v => update('goal_type', v as GoalType)}
        />
      </FieldGroup>

      {/* Weekly rate — shown only for lose/gain */}
      {values.goal_type !== 'maintain' && (
        <FieldGroup label={values.goal_type === 'lose' ? 'Weekly loss rate' : 'Weekly gain rate'}>
          <NumberInput
            value={values.weekly_rate_kg}
            onChangeValue={v => update('weekly_rate_kg', v)}
            suffix="kg/week"
            min={0.1}
            max={1.5}
          />
        </FieldGroup>
      )}

      {/* Live macro preview */}
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Daily targets</Text>
        <Text style={styles.kcalPreview}>{targets.kcal} kcal</Text>
        <View style={styles.macroChips}>
          <MacroBadge type="protein" value={targets.protein_g} />
          <MacroBadge type="carbs" value={targets.carbs_g} />
          <MacroBadge type="fat" value={targets.fat_g} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitSuccess && styles.submitBtnSuccess]}
        onPress={() => onSubmit(values)}
        disabled={submitDisabled}
        accessibilityRole="button"
      >
        <Text style={styles.submitBtnText}>{submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentPicker({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.segment, selected === opt.value && styles.segmentActive]}
          onPress={() => onSelect(opt.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === opt.value }}
        >
          <Text style={[styles.segmentText, selected === opt.value && styles.segmentTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  segmentTextActive: {
    color: colors.background,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  optionDesc: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kcalPreview: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  macroChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnSuccess: {
    backgroundColor: '#16a34a',
  },
  submitBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
