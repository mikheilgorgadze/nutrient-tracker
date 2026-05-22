import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getLatestTdeeEstimate } from '@/lib/db/queries/progress';
import { getGoals } from '@/lib/db/queries/goals';
import { mifflinBMR, baselineTDEE } from '@/lib/algorithms/tdee';
import type { TdeeHistoryRow } from '@/lib/db/types';

export interface TdeeData {
  /** Latest TDEE estimate (adaptive or baseline) */
  estimatedTdee: number;
  /** Confidence 0–1, null if using baseline only */
  confidence: number | null;
  latestRow: TdeeHistoryRow | null;
}

export function useTdeeEstimate() {
  const db = useDb();

  return useQuery<TdeeData>({
    queryKey: ['progress', 'tdee'],
    enabled: db !== null,
    queryFn: () => {
      const row = getLatestTdeeEstimate(db!);
      const goals = getGoals(db!);

      if (row) {
        return { estimatedTdee: row.estimated_tdee, confidence: row.confidence, latestRow: row };
      }

      // Fall back to Mifflin baseline
      if (goals) {
        const bmr = mifflinBMR({
          sex: goals.sex,
          age: goals.age_years,
          height_cm: goals.height_cm,
          weight_kg: goals.weight_kg,
        });
        const tdee = baselineTDEE(bmr, goals.activity_level);
        return { estimatedTdee: tdee, confidence: null, latestRow: null };
      }

      return { estimatedTdee: 0, confidence: null, latestRow: null };
    },
    staleTime: 0,
  });
}
