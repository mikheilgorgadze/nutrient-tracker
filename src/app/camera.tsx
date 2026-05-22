import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePhotoAnalysis } from '@/features/camera/hooks/usePhotoAnalysis';
import { EstimateReviewSheet } from '@/features/camera/components/EstimateReviewSheet';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

export default function CameraScreen() {
  const { state, pickAndAnalyze, reset } = usePhotoAnalysis();

  const isAnalyzing = state.status === 'analyzing' || state.status === 'picking';

  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Analyze Food</Text>
        <Text style={styles.subtitle}>
          Take or select a photo to get an instant macro estimate.
        </Text>

        {state.status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{state.message}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.photoBtn, isAnalyzing && styles.photoBtnDisabled]}
          onPress={pickAndAnalyze}
          disabled={isAnalyzing}
          accessibilityRole="button"
          accessibilityLabel="Choose photo from library"
        >
          {isAnalyzing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.photoBtnText}>
              {state.status === 'error' ? 'Try Again' : 'Choose Photo'}
            </Text>
          )}
        </TouchableOpacity>

        {isAnalyzing && (
          <Text style={styles.analyzeStatus}>
            {state.status === 'picking' ? 'Selecting photo…' : 'Analyzing with Claude…'}
          </Text>
        )}
      </View>

      <EstimateReviewSheet
        estimate={state.status === 'done' ? state.estimate : null}
        visible={state.status === 'done'}
        onClose={() => {
          reset();
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: colors.danger + '22',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  photoBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    minWidth: 200,
    alignItems: 'center',
  },
  photoBtnDisabled: {
    opacity: 0.6,
  },
  photoBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  analyzeStatus: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
