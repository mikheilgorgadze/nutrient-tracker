import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getDiaryEntriesForDate } from '@/lib/db/queries/diary';
import { getGoals } from '@/lib/db/queries/goals';
import { getLatestTdeeEstimate } from '@/lib/db/queries/progress';
import { mifflinBMR, baselineTDEE } from '@/lib/algorithms/tdee';
import { dailyTargets } from '@/lib/algorithms/targets';
import { sumMacros } from '@/lib/algorithms/macros';
import type { DiaryEntryWithFood, MacroTotals, MealSlot } from '@/lib/db/types';
import type { MacroTargets } from '@/lib/algorithms/targets';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export interface DiarySection {
  slot: MealSlot;
  entries: DiaryEntryWithFood[];
  subtotal: MacroTotals;
}

export interface DiaryData {
  sections: DiarySection[];
  totals: MacroTotals;
  targets: MacroTargets;
  hasGoals: boolean;
}

function DEFAULT_TARGETS(): MacroTargets {
  return { kcal: 2000, protein_g: 150, carbs_g: 200, fat_g: 55 };
}

export function useDiary(date: string) {
  const db = useDb();

  return useQuery<DiaryData>({
    queryKey: ['diary', date],
    enabled: db !== null,
    queryFn: () => {
      const entries = getDiaryEntriesForDate(db!, date);
      const goals = getGoals(db!);
      const tdeeRow = getLatestTdeeEstimate(db!);

      let targets: MacroTargets;
      let hasGoals = false;

      if (goals) {
        hasGoals = true;
        const bmr = mifflinBMR({
          sex: goals.sex,
          age: goals.age_years,
          height_cm: goals.height_cm,
          weight_kg: goals.weight_kg,
        });
        const tdee = tdeeRow?.estimated_tdee ?? baselineTDEE(bmr, goals.activity_level);
        targets = dailyTargets(
          tdee,
          { goalType: goals.goal_type, weeklyRateKg: goals.weekly_rate_kg },
          goals.weight_kg,
        );
      } else {
        targets = DEFAULT_TARGETS();
      }

      // Group entries by meal slot
      const bySlot = new Map<MealSlot, DiaryEntryWithFood[]>();
      for (const slot of MEAL_SLOTS) bySlot.set(slot, []);
      for (const entry of entries) {
        bySlot.get(entry.meal_slot)?.push(entry);
      }

      const sections: DiarySection[] = MEAL_SLOTS.map(slot => {
        const slotEntries = bySlot.get(slot) ?? [];
        return {
          slot,
          entries: slotEntries,
          subtotal: sumMacros(slotEntries.map(e => ({
            kcal: e.kcal, protein_g: e.protein_g, carbs_g: e.carbs_g, fat_g: e.fat_g,
          }))),
        };
      });

      const totals = sumMacros(sections.map(s => s.subtotal));

      return { sections, totals, targets, hasGoals };
    },
    staleTime: 0,
  });
}
