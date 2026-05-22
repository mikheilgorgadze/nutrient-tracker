import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { upsertGoals } from '@/lib/db/queries/goals';
import type { GoalsRow } from '@/lib/db/types';

export function useGoalsMutations() {
  const db = useDb();
  const queryClient = useQueryClient();

  const saveGoals = useMutation({
    mutationFn: (goals: Omit<GoalsRow, 'id' | 'created_at' | 'updated_at'>) => {
      if (!db) throw new Error('DB not ready');
      upsertGoals(db, goals);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['diary'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  return { saveGoals };
}
