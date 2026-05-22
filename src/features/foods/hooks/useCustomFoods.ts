import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getCustomFoods } from '@/lib/db/queries/foods';
import type { FoodRow } from '@/lib/db/types';

export function useCustomFoods() {
  const db = useDb();
  return useQuery<FoodRow[]>({
    queryKey: ['foods', 'custom'],
    enabled: db !== null,
    queryFn: () => getCustomFoods(db!),
    staleTime: 0,
  });
}
