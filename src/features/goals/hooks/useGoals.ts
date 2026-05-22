import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getGoals } from '@/lib/db/queries/goals';
import type { GoalsRow } from '@/lib/db/types';

export function useGoals(): { goals: GoalsRow | null; hasGoals: boolean; isLoading: boolean } {
  const db = useDb();

  const { data, isLoading } = useQuery<GoalsRow | null>({
    queryKey: ['goals'],
    enabled: db !== null,
    queryFn: () => getGoals(db!),
    staleTime: 0,
  });

  return {
    goals: data ?? null,
    hasGoals: data != null,
    isLoading,
  };
}
