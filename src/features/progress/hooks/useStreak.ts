import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getLogStreak } from '@/lib/db/queries/progress';

/**
 * Returns the current consecutive-day logging streak (number of days).
 * Counts today and/or yesterday; breaks on the first day without an entry.
 */
export function useStreak(): number {
  const db = useDb();

  const { data } = useQuery<number>({
    queryKey: ['progress', 'streak'],
    enabled: db !== null,
    queryFn: () => getLogStreak(db!),
    staleTime: 0,
  });

  return data ?? 0;
}
