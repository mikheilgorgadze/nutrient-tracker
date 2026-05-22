import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { insertDiaryEntry, deleteDiaryEntry, updateDiaryEntryServings } from '@/lib/db/queries/diary';
import { macrosForServings } from '@/lib/algorithms/macros';
import { newId, today } from '@/lib/db';
import type { DiaryEntryRow, FoodRow, MealSlot } from '@/lib/db/types';

export function useDiaryMutations() {
  const db = useDb();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['diary'] });
  }

  const addEntry = useMutation({
    mutationFn: ({
      food,
      servings,
      date,
      mealSlot,
    }: {
      food: FoodRow;
      servings: number;
      date?: string;
      mealSlot: MealSlot;
    }) => {
      if (!db) throw new Error('DB not ready');
      const macros = macrosForServings(food, servings);
      const entry: Omit<DiaryEntryRow, 'created_at'> = {
        id: newId(),
        food_id: food.id,
        date: date ?? today(),
        meal_slot: mealSlot,
        servings,
        kcal: macros.kcal,
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g,
      };
      insertDiaryEntry(db, entry);
      return Promise.resolve(entry);
    },
    onSuccess: invalidate,
    onError: (err) => {
      console.error('[addEntry] failed:', err);
    },
  });

  const removeEntry = useMutation({
    mutationFn: (id: string) => {
      if (!db) throw new Error('DB not ready');
      deleteDiaryEntry(db, id);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const updateServings = useMutation({
    mutationFn: ({
      entryId,
      servings,
      food,
      mealSlot,
    }: {
      entryId: string;
      servings: number;
      food: FoodRow;
      mealSlot?: MealSlot;
    }) => {
      if (!db) throw new Error('DB not ready');
      const macros = macrosForServings(food, servings);
      updateDiaryEntryServings(db, entryId, servings, macros, mealSlot);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  return { addEntry, removeEntry, updateServings };
}
