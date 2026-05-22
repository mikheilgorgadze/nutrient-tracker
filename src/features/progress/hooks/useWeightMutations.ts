import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { upsertWeight } from '@/lib/db/queries/progress';
import { newId } from '@/lib/db';
import type { WeightLogRow } from '@/lib/db/types';

export function useWeightMutations() {
  const db = useDb();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  }

  const logWeight = useMutation({
    mutationFn: ({ date, weight_kg, note }: { date: string; weight_kg: number; note?: string }) => {
      if (!db) throw new Error('DB not ready');
      const entry: Omit<WeightLogRow, 'created_at'> = {
        id: newId(),
        date,
        weight_kg,
        note: note ?? null,
      };
      upsertWeight(db, entry);
      return Promise.resolve(entry);
    },
    onSuccess: invalidate,
  });

  return { logWeight };
}
