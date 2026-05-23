import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { NumberInput } from '@/components/NumberInput';
import { today } from '@/lib/db';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

interface WeightEntrySheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (date: string, weight_kg: number) => void;
  initialWeight?: number;
}

export function WeightEntrySheet({
  visible,
  onClose,
  onSave,
  initialWeight = 70,
}: WeightEntrySheetProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [weight, setWeight] = useState(initialWeight);

  function handleSave() {
    onSave(today(), weight);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Log Weight">
      <View style={styles.content}>
        <Text style={styles.label}>Weight</Text>
        <NumberInput
          value={weight}
          onChangeValue={setWeight}
          suffix="kg"
          min={20}
          max={300}
          autoFocus
        />
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save weight"
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
