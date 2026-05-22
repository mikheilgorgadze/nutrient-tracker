import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { insertFood, updateFood, deleteCustomFood } from '@/lib/db/queries/foods';
import { newId } from '@/lib/db';
import type { FoodRow } from '@/lib/db/types';

export function useFoodMutations() {
  const db = useDb();
  const queryClient = useQueryClient();

  function invalidateFoods() {
    queryClient.invalidateQueries({ queryKey: ['foods'] });
    queryClient.invalidateQueries({ queryKey: ['diary'] });
  }

  const createFood = useMutation({
    mutationFn: (food: Omit<FoodRow, 'id' | 'created_at'>) => {
      if (!db) throw new Error('DB not ready');
      const newFood: Omit<FoodRow, 'created_at'> = { ...food, id: newId() };
      insertFood(db, newFood);
      return Promise.resolve(newFood);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: (err) => {
      console.error('[createFood] failed:', err);
    },
  });

  const editFood = useMutation({
    mutationFn: ({ id, fields }: {
      id: string;
      fields: Pick<FoodRow, 'name' | 'brand' | 'serving_size_g' | 'serving_label' | 'kcal_per_serving' | 'protein_g' | 'carbs_g' | 'fat_g'>;
    }) => {
      if (!db) throw new Error('DB not ready');
      updateFood(db, id, fields);
      return Promise.resolve();
    },
    onSuccess: invalidateFoods,
    onError: (err) => { console.error('[editFood] failed:', err); },
  });

  const removeFood = useMutation({
    mutationFn: (id: string) => {
      if (!db) throw new Error('DB not ready');
      deleteCustomFood(db, id);
      return Promise.resolve();
    },
    onSuccess: invalidateFoods,
    onError: (err) => { console.error('[removeFood] failed:', err); },
  });

  return { createFood, editFood, removeFood };
}
