import React, { useState, useEffect, useRef } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, Keyboard } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

interface NumberInputProps extends Omit<TextInputProps, 'onChangeText' | 'value' | 'keyboardType'> {
  value: number;
  onChangeValue: (value: number) => void;
  /** Label shown after the input, e.g. "servings" or "g" */
  suffix?: string;
  min?: number;
  max?: number;
  /** Debounce delay in ms, default 300 */
  debounceMs?: number;
}

export function NumberInput({
  value,
  onChangeValue,
  suffix,
  min,
  max,
  debounceMs = 300,
  style,
  ...props
}: NumberInputProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [text, setText] = useState(String(value));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes (e.g. reset) back into text state
  useEffect(() => {
    setText(String(value));
  }, [value]);

  function handleChange(raw: string) {
    // Allow digits, one decimal point, and empty string
    const sanitized = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setText(sanitized);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseFloat(sanitized);
      if (!isNaN(parsed)) {
        let clamped = parsed;
        if (min !== undefined) clamped = Math.max(min, clamped);
        if (max !== undefined) clamped = Math.min(max, clamped);
        onChangeValue(clamped);
      }
    }, debounceMs);
  }

  // Flush on blur
  function handleBlur() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChangeValue(clamped);
      setText(String(clamped));
    } else {
      // Reset to current value if invalid
      setText(String(value));
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={text}
        onChangeText={handleChange}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        {...props}
      />
      {suffix && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
    padding: 0,
    margin: 0,
  },
  suffix: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
  },
});
