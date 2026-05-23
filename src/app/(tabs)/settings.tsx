import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { GoalsForm } from '@/features/goals/components/GoalsForm';
import { useGoals } from '@/features/goals/hooks/useGoals';
import { useGoalsMutations } from '@/features/goals/hooks/useGoalsMutations';
import { useDb } from '@/hooks/useDb';
import { exportBackup } from '@/lib/backup/export';
import { importBackup } from '@/lib/backup/import';
import { RemindersSection } from '@/features/settings/components/RemindersSection';
import { useColors } from '@/hooks/useColors';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

export default function SettingsTab() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const { goals, isLoading } = useGoals();
  const { saveGoals } = useGoalsMutations();
  const db = useDb();
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    if (!db) return;
    setExporting(true);
    try {
      await exportBackup(db);
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!db) return;
    setImporting(true);
    try {
      const result = await importBackup(db);
      if (result.ok) {
        Alert.alert(
          'Import complete',
          `Restored ${result.counts.diary} diary entries, ${result.counts.weight} weight logs, ${result.counts.foods} custom foods.`,
        );
      } else if (result.error !== 'cancelled') {
        Alert.alert('Import failed', result.error);
      }
    } catch (e) {
      Alert.alert('Import failed', (e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <FeatureErrorBoundary fallbackTitle="Could not load settings">
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Profile, macro targets, and data.</Text>
          </View>

          <GoalsForm
            initialValues={goals ?? undefined}
            submitLabel={saved ? 'Saved!' : 'Save Changes'}
            submitDisabled={saveGoals.isPending || saved}
            submitSuccess={saved}
            onSubmit={values =>
              saveGoals.mutate(values, {
                onSuccess: () => {
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2500);
                },
              })
            }
          />

          {/* Backup section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Backup</Text>
            <Text style={styles.sectionSubtitle}>
              Export saves your diary, weight, and custom foods to a JSON file you can keep anywhere. Import merges a backup into your current data.
            </Text>

            <TouchableOpacity
              style={styles.backupBtn}
              onPress={handleExport}
              disabled={exporting}
              accessibilityRole="button"
              accessibilityLabel="Export backup"
            >
              {exporting
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Ionicons name="share-outline" size={20} color={colors.accent} />}
              <Text style={styles.backupBtnText}>Export backup…</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backupBtn}
              onPress={handleImport}
              disabled={importing}
              accessibilityRole="button"
              accessibilityLabel="Import backup"
            >
              {importing
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Ionicons name="download-outline" size={20} color={colors.accent} />}
              <Text style={styles.backupBtnText}>Import backup…</Text>
            </TouchableOpacity>
          </View>

          <RemindersSection />

          {/* Theme section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.themeRow}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.themeBtn, themeMode === m && styles.themeBtnActive]}
                  onPress={() => setThemeMode(m)}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.charAt(0).toUpperCase() + m.slice(1)} theme`}
                >
                  <Text style={[styles.themeBtnText, themeMode === m && styles.themeBtnTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* About section */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutText}>NutrientTracker v{version}</Text>
            <Text style={styles.aboutSubtext}>Fully offline · All data stays on your device</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FeatureErrorBoundary>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  backupBtnText: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  aboutText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
  aboutSubtext: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  themeBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  themeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  themeBtnTextActive: {
    color: colors.background,
  },
});
