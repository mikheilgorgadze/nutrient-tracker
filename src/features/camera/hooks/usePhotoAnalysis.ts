import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeFood } from '@/lib/ai/analyze';
import { ApiKeyMissingError } from '@/lib/ai/errors';
import type { FoodEstimate } from '@/lib/ai/schema';

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'picking' }
  | { status: 'analyzing' }
  | { status: 'done'; estimate: FoodEstimate }
  | { status: 'error'; message: string };

export function usePhotoAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });

  async function pickAndAnalyze() {
    setState({ status: 'picking' });

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        setState({ status: 'idle' });
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        setState({ status: 'idle' });
        return;
      }

      setState({ status: 'analyzing' });

      // Resize to max 1024px on longest side to keep base64 size reasonable
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (!manipulated.base64) {
        setState({ status: 'error', message: 'Failed to encode image' });
        return;
      }

      const estimate = await analyzeFood(manipulated.base64);
      setState({ status: 'done', estimate });
    } catch (err) {
      if (err instanceof ApiKeyMissingError) {
        setState({ status: 'error', message: 'API key not configured' });
      } else {
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  }

  function reset() {
    setState({ status: 'idle' });
  }

  return { state, pickAndAnalyze, reset };
}
