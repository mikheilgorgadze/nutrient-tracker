import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/BottomSheet';
import { useTemplates, useTemplateMutations } from '../hooks/useTemplates';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { MealSlot } from '@/lib/db/types';
import type { TemplateRow } from '@/lib/db/queries/templates';

interface TemplatesSheetProps {
  visible: boolean;
  onClose: () => void;
  activeMealSlot: MealSlot;
  activeDate: string;
}

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={onDelete}
      accessibilityLabel="Delete template"
      accessibilityRole="button"
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );
}

interface TemplateRowItemProps {
  template: TemplateRow;
  onLog: () => void;
  onDelete: () => void;
}

function TemplateRowItem({ template, onLog, onDelete }: TemplateRowItemProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <Swipeable
      renderRightActions={() => <DeleteAction onDelete={onDelete} />}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.templateRow}
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={`Log template ${template.name}`}
      >
        <Ionicons name="restaurant-outline" size={20} color={colors.textTertiary} />
        <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
      </TouchableOpacity>
    </Swipeable>
  );
}

export function TemplatesSheet({
  visible,
  onClose,
  activeMealSlot,
  activeDate,
}: TemplatesSheetProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { templates } = useTemplates();
  const { deleteTemplate, logTemplate } = useTemplateMutations();

  function handleLog(templateId: string) {
    logTemplate.mutate(
      { templateId, date: activeDate, mealSlot: activeMealSlot },
      { onSuccess: onClose },
    );
  }

  function handleDelete(id: string) {
    deleteTemplate.mutate(id);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Meal Templates">
      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No templates saved.</Text>
          <Text style={styles.emptySubtext}>
            Save a meal section as a template to reuse it.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TemplateRowItem
              template={item}
              onLog={() => handleLog(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close templates"
      >
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  templateName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
