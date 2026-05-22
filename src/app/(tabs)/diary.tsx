import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { DiaryScreen } from '@/features/diary/screens/DiaryScreen';

export default function DiaryTab() {
  return (
    <FeatureErrorBoundary fallbackTitle="Could not load diary">
      <DiaryScreen />
    </FeatureErrorBoundary>
  );
}
