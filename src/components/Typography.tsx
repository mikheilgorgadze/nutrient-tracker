import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight } from '@/lib/theme/tokens';

interface TypographyProps extends TextProps {
  children?: React.ReactNode;
  tabular?: boolean;
}

export function Heading({ style, tabular, ...props }: TypographyProps) {
  return (
    <Text
      style={[styles.heading, tabular && styles.tabular, style]}
      {...props}
    />
  );
}

export function Body({ style, tabular, ...props }: TypographyProps) {
  return (
    <Text
      style={[styles.body, tabular && styles.tabular, style]}
      {...props}
    />
  );
}

export function Caption({ style, tabular, ...props }: TypographyProps) {
  return (
    <Text
      style={[styles.caption, tabular && styles.tabular, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  body: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
