import type { GoalType, MacroTotals } from '@/lib/db/types';

const KCAL_PER_KG = 7700;

/** kcal/g for each macro */
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/** Default protein target in g per kg of body weight */
const DEFAULT_PROTEIN_G_PER_KG = 2.0;

/** Default fat as fraction of total kcal */
const DEFAULT_FAT_FRACTION = 0.25;

export interface GoalParams {
  goalType: GoalType;
  weeklyRateKg: number;   // e.g. 0.5 kg/week
}

export interface MacroTargets extends MacroTotals {}

/**
 * Calculates daily calorie and macro targets.
 *
 * Algorithm:
 *   1. Calorie target = TDEE ± (weeklyRateKg * 7700 / 7)
 *   2. Protein = 2.0 g/kg body weight (fills muscle-preservation needs)
 *   3. Fat = 25% of calorie target / 9 (essential fatty acids floor)
 *   4. Carbs = remainder (absorbs rounding; floored at 0)
 */
export function dailyTargets(
  tdee: number,
  goals: GoalParams,
  bodyWeightKg: number,
): MacroTargets {
  const dailyDelta = (goals.weeklyRateKg * KCAL_PER_KG) / 7;

  const kcal = Math.round(
    goals.goalType === 'lose'     ? tdee - dailyDelta :
    goals.goalType === 'gain'     ? tdee + dailyDelta :
    /* maintain */                  tdee
  );

  const protein_g = Math.round(DEFAULT_PROTEIN_G_PER_KG * bodyWeightKg);
  const fat_g     = Math.round((kcal * DEFAULT_FAT_FRACTION) / KCAL_PER_G.fat);

  const remainingKcal = kcal - protein_g * KCAL_PER_G.protein - fat_g * KCAL_PER_G.fat;
  const carbs_g = Math.max(0, Math.round(remainingKcal / KCAL_PER_G.carbs));

  return { kcal, protein_g, carbs_g, fat_g };
}
