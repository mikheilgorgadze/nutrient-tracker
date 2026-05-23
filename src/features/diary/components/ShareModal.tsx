import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { DailySummaryCard } from './DailySummaryCard';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { MacroTotals } from '@/lib/db/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  date: string;
  totals: MacroTotals;
  targets: MacroTotals;
  /** Captures the off-screen card rendered in the parent (outside Modal window). */
  onCapture: () => Promise<string>;
}

type Action = 'save' | 'share' | null;

export function ShareModal({ visible, onClose, date, totals, targets, onCapture }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [busy, setBusy] = useState<Action>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  async function handleSave() {
    if (busy) return;
    setBusy('save');
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        // Falls back to share sheet when media library is unavailable (Expo Go on Android)
        const uri = await onCapture();
        const available = await Sharing.isAvailableAsync();
        if (available) await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
        return;
      }
      const uri = await onCapture();
      await MediaLibrary.saveToLibraryAsync(uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch {
      // silent
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy('share');
    try {
      const uri = await onCapture();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your daily summary',
          UTI: 'public.png',
        });
      }
    } catch {
      // user cancelled
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Preview — React component, not a screenshot, so always renders correctly */}
              <View style={styles.previewWrapper}>
                <DailySummaryCard date={date} totals={totals} targets={targets} />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, savedFeedback && styles.actionBtnSuccess]}
                  onPress={handleSave}
                  disabled={busy !== null}
                  accessibilityRole="button"
                  accessibilityLabel="Save to Photos"
                >
                  {busy === 'save' ? (
                    <ActivityIndicator color={colors.textPrimary} size="small" />
                  ) : (
                    <Ionicons
                      name={savedFeedback ? 'checkmark' : 'download-outline'}
                      size={22}
                      color={savedFeedback ? colors.accent : colors.textPrimary}
                    />
                  )}
                  <Text style={[styles.actionLabel, savedFeedback && { color: colors.accent }]}>
                    {savedFeedback ? 'Saved!' : 'Save Image'}
                  </Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleShare}
                    disabled={busy !== null}
                    accessibilityRole="button"
                    accessibilityLabel="Share image"
                  >
                    {busy === 'share' ? (
                      <ActivityIndicator color={colors.textPrimary} size="small" />
                    ) : (
                      <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
                    )}
                    <Text style={styles.actionLabel}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  previewWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: borderRadius.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionBtnSuccess: {
    borderColor: colors.accent,
  },
  actionLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
  },
  cancelLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
});
