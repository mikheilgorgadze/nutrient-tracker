import React, { useState, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useBarcodeLookup } from '../hooks/useBarcodeLookup';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow } from '@/lib/db/types';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onFound: (food: FoodRow) => void;
}

export function BarcodeScannerModal({ visible, onClose, onFound }: BarcodeScannerModalProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const { state, lookup, reset } = useBarcodeLookup();
  const scanLock = useRef(false);

  function handleClose() {
    reset();
    scanLock.current = false;
    onClose();
  }

  async function handleBarcode({ data }: { data: string }) {
    if (scanLock.current || state.status === 'loading') return;
    scanLock.current = true;
    await lookup(data);
    scanLock.current = false;
  }

  // When a food is found, pass it up and close
  React.useEffect(() => {
    if (state.status === 'found') {
      onFound(state.food);
      handleClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} accessibilityLabel="Close scanner">
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        {!permission?.granted ? (
          <View style={styles.permBox}>
            <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.permText}>Camera access is needed to scan barcodes.</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
              onBarcodeScanned={handleBarcode}
            />

            {/* Viewfinder overlay */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.hint}>Point at a barcode</Text>
            </View>

            {/* Status banner */}
            {state.status === 'loading' && (
              <View style={styles.banner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.bannerText}>Looking up…</Text>
              </View>
            )}
            {state.status === 'not_found' && (
              <View style={[styles.banner, styles.bannerWarn]}>
                <Ionicons name="alert-circle-outline" size={18} color="#fff" />
                <Text style={styles.bannerText}>Product not found — try again</Text>
                <TouchableOpacity onPress={reset} style={styles.bannerRetry}>
                  <Text style={styles.bannerRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {state.status === 'error' && (
              <View style={[styles.banner, styles.bannerError]}>
                <Ionicons name="wifi-outline" size={18} color="#fff" />
                <Text style={styles.bannerText}>{state.message}</Text>
                <TouchableOpacity onPress={reset} style={styles.bannerRetry}>
                  <Text style={styles.bannerRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const CORNER = 24;
const BORDER = 3;
const VF_SIZE = 240;

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.lg,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  permText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  permBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  viewfinder: {
    width: VF_SIZE,
    height: VF_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
  },
  cornerTL: { top: 0,        left: 0,        borderTopWidth: BORDER,    borderLeftWidth: BORDER },
  cornerTR: { top: 0,        right: 0,       borderTopWidth: BORDER,    borderRightWidth: BORDER },
  cornerBL: { bottom: 0,     left: 0,        borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  cornerBR: { bottom: 0,     right: 0,       borderBottomWidth: BORDER, borderRightWidth: BORDER },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  banner: {
    position: 'absolute',
    bottom: 80,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bannerWarn:  { backgroundColor: 'rgba(202,138,4,0.85)' },
  bannerError: { backgroundColor: 'rgba(220,38,38,0.85)' },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontSize: fontSize.sm,
  },
  bannerRetry: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bannerRetryText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
