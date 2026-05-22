import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { searchFoods } from '@/lib/db/queries/foods';
import type { FoodRow } from '@/lib/db/types';

export function useFoodSearch(term: string): {
  results: FoodRow[];
  isLoading: boolean;
} {
  const db = useDb();

  const { data, isFetching } = useQuery<FoodRow[]>({
    queryKey: ['foods', 'search', term],
    enabled: db !== null && term.length >= 2,
    queryFn: () => searchFoods(db!, term, 30),
    staleTime: 30_000,
  });

  return {
    results: data ?? [],
    isLoading: isFetching,
  };
}
