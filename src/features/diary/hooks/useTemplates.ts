import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import {
  getTemplates,
  getTemplateItems,
  saveTemplate as saveTemplateQuery,
  deleteTemplate as deleteTemplateQuery,
} from '@/lib/db/queries/templates';
import { insertDiaryEntry } from '@/lib/db/queries/diary';
import { macrosForServings } from '@/lib/algorithms/macros';
import { newId, today } from '@/lib/db';
import type { MealSlot, DiaryEntryRow } from '@/lib/db/types';
import type { TemplateRow } from '@/lib/db/queries/templates';

export function useTemplates() {
  const db = useDb();

  const { data: templates = [], isLoading } = useQuery<TemplateRow[]>({
    queryKey: ['templates'],
    enabled: db !== null,
    queryFn: () => getTemplates(db!),
    staleTime: 0,
  });

  return { templates, isLoading };
}

export function useTemplateMutations() {
  const db = useDb();
  const queryClient = useQueryClient();

  function invalidateDiary() {
    queryClient.invalidateQueries({ queryKey: ['diary'] });
  }

  function invalidateTemplates() {
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  }

  const saveTemplate = useMutation({
    mutationFn: ({
      name,
      items,
    }: {
      name: string;
      items: Array<{ food_id: string; servings: number }>;
    }) => {
      if (!db) throw new Error('DB not ready');
      const id = saveTemplateQuery(db, name, items);
      return Promise.resolve(id);
    },
    onSuccess: invalidateTemplates,
    onError: (err) => {
      console.error('[saveTemplate] failed:', err);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => {
      if (!db) throw new Error('DB not ready');
      deleteTemplateQuery(db, id);
      return Promise.resolve();
    },
    onSuccess: invalidateTemplates,
  });

  const logTemplate = useMutation({
    mutationFn: ({
      templateId,
      date,
      mealSlot,
    }: {
      templateId: string;
      date: string;
      mealSlot: MealSlot;
    }) => {
      if (!db) throw new Error('DB not ready');
      const items = getTemplateItems(db, templateId);
      for (const item of items) {
        const macros = macrosForServings(item.food, item.servings);
        const entry: Omit<DiaryEntryRow, 'created_at'> = {
          id: newId(),
          food_id: item.food_id,
          date: date ?? today(),
          meal_slot: mealSlot,
          servings: item.servings,
          kcal: macros.kcal,
          protein_g: macros.protein_g,
          carbs_g: macros.carbs_g,
          fat_g: macros.fat_g,
        };
        insertDiaryEntry(db, entry);
      }
      return Promise.resolve();
    },
    onSuccess: invalidateDiary,
    onError: (err) => {
      console.error('[logTemplate] failed:', err);
    },
  });

  return { saveTemplate, deleteTemplate, logTemplate };
}
