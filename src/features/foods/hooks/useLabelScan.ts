import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeLabelPhoto } from '@/lib/ai/analyze';
import { ApiKeyMissingError } from '@/lib/ai/errors';
import type { LabelEstimate } from '@/lib/ai/schema';

export type LabelScanState =
  | { status: 'idle' }
  | { status: 'picking' }
  | { status: 'scanning' }
  | { status: 'done'; label: LabelEstimate }
  | { status: 'error'; message: string };

export function useLabelScan() {
  const [state, setState] = useState<LabelScanState>({ status: 'idle' });

  async function scanLabel() {
    setState({ status: 'picking' });

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) {
        setState({ status: 'idle' });
        return;
      }

      const asset = result.assets[0];
      if (!asset) { setState({ status: 'idle' }); return; }

      setState({ status: 'scanning' });

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (!manipulated.base64) {
        setState({ status: 'error', message: 'Failed to encode image' });
        return;
      }

      const label = await analyzeLabelPhoto(manipulated.base64);
      setState({ status: 'done', label });
    } catch (err) {
      if (err instanceof ApiKeyMissingError) {
        setState({ status: 'error', message: 'Anthropic API key not configured' });
      } else {
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Scan failed' });
      }
    }
  }

  function reset() {
    setState({ status: 'idle' });
  }

  return { state, scanLabel, reset };
}
