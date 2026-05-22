import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { ProgressScreen } from '@/features/progress/screens/ProgressScreen';

export default function ProgressTab() {
  return (
    <FeatureErrorBoundary fallbackTitle="Could not load progress">
      <ProgressScreen />
    </FeatureErrorBoundary>
  );
}
