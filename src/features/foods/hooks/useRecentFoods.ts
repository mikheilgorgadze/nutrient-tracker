import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getRecentFoods } from '@/lib/db/queries/diary';
import type { FoodRow } from '@/lib/db/types';

export function useRecentFoods(limit = 8): { data: FoodRow[] } {
  const db = useDb();
  const { data } = useQuery({
    queryKey: ['recent-foods', limit],
    enabled: db !== null,
    queryFn: () => getRecentFoods(db!, limit),
    staleTime: 30_000,
  });
  return { data: data ?? [] };
}
