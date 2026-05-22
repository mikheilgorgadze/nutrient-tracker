import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApiKey } from '@/lib/ai/client';
import { colors, spacing, borderRadius } from '@/lib/theme/tokens';

interface AddEntryFABProps {
  onPress: () => void;
}

export function AddEntryFAB({ onPress }: AddEntryFABProps) {
  const hasApiKey = Boolean(getApiKey());

  return (
    <View style={styles.group}>
      {hasApiKey && (
        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => router.push('/camera')}
          accessibilityRole="button"
          accessibilityLabel="Analyze food photo"
        >
          <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Add food entry"
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cameraIcon: {
    fontSize: 20,
  },
});
