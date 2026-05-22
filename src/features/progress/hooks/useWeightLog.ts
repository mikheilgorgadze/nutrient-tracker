import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getWeightLog } from '@/lib/db/queries/progress';
import { ewma } from '@/lib/algorithms/trends';
import type { WeightLogRow } from '@/lib/db/types';

export interface WeightLogData {
  entries: WeightLogRow[];
  rawWeights: number[];
  smoothedWeights: number[];
  dates: string[];
}

export function useWeightLog(days = 90) {
  const db = useDb();

  return useQuery<WeightLogData>({
    queryKey: ['progress', 'weightLog', days],
    enabled: db !== null,
    queryFn: () => {
      const entries = getWeightLog(db!, days);
      const rawWeights = entries.map(e => e.weight_kg);
      const smoothedWeights = ewma(rawWeights);
      const dates = entries.map(e => e.date);
      return { entries, rawWeights, smoothedWeights, dates };
    },
    staleTime: 0,
  });
}
