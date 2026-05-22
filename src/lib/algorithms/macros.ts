import type { FoodRow, MacroTotals } from '@/lib/db/types';

/**
 * Calculates macros for a given number of servings of a food.
 * All values rounded to 1 decimal place.
 */
export function macrosForServings(
  food: Pick<FoodRow, 'kcal_per_serving' | 'protein_g' | 'carbs_g' | 'fat_g'>,
  servings: number,
): MacroTotals {
  return {
    kcal:      Math.round(food.kcal_per_serving * servings * 10) / 10,
    protein_g: Math.round(food.protein_g * servings * 10) / 10,
    carbs_g:   Math.round(food.carbs_g * servings * 10) / 10,
    fat_g:     Math.round(food.fat_g * servings * 10) / 10,
  };
}

/**
 * Sums an array of macro objects into a single total.
 * Returns zeros for an empty array.
 */
export function sumMacros(entries: MacroTotals[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      kcal:      acc.kcal      + e.kcal,
      protein_g: acc.protein_g + e.protein_g,
      carbs_g:   acc.carbs_g   + e.carbs_g,
      fat_g:     acc.fat_g     + e.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}
