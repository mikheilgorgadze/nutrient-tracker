import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLogRow } from '@/components/FoodLogRow';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
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
  onSaveTemplate?: (name: string) => void;
}

export function MealSection({
  section,
  onDeleteEntry,
  onPressEntry,
  onAddToSlot,
  onSaveTemplate,
}: MealSectionProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [collapsed, setCollapsed] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { slot, entries, subtotal } = section;
  const label = MEAL_LABELS[slot] ?? slot;

  function handleSaveTemplatePress() {
    if (Platform.OS === 'ios') {
      Alert.prompt('Save Template', 'Name this template:', (name) => {
        if (name?.trim()) {
          onSaveTemplate?.(name.trim());
        }
      });
    } else {
      setSavingTemplate(true);
      setTemplateName('');
    }
  }

  function handleSaveTemplateConfirm() {
    if (templateName.trim()) {
      onSaveTemplate?.(templateName.trim());
    }
    setSavingTemplate(false);
    setTemplateName('');
  }

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

          {/* Add button row */}
          <View style={styles.addRow}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={onAddToSlot}
              accessibilityRole="button"
              accessibilityLabel={`Add food to ${label}`}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={styles.addBtnText}>Add food</Text>
            </TouchableOpacity>

            {entries.length > 0 && onSaveTemplate && (
              <TouchableOpacity
                style={styles.saveTemplateBtn}
                onPress={handleSaveTemplatePress}
                accessibilityRole="button"
                accessibilityLabel={`Save ${label} as template`}
              >
                <Ionicons name="bookmark-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.saveTemplateBtnText}>Save template</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Android inline template name input */}
          {savingTemplate && (
            <View style={styles.templateInputRow}>
              <TextInput
                style={styles.templateInput}
                value={templateName}
                onChangeText={setTemplateName}
                placeholder="Template name"
                placeholderTextColor={colors.textTertiary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveTemplateConfirm}
                accessibilityLabel="Template name"
              />
              <TouchableOpacity
                style={styles.templateSaveConfirmBtn}
                onPress={handleSaveTemplateConfirm}
                accessibilityRole="button"
                accessibilityLabel="Confirm save template"
              >
                <Text style={styles.templateSaveConfirmText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateCancelBtn}
                onPress={() => { setSavingTemplate(false); setTemplateName(''); }}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.templateCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  addBtnText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  saveTemplateBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  templateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  templateInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  templateSaveConfirmBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  templateSaveConfirmText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  templateCancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  templateCancelText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
});
