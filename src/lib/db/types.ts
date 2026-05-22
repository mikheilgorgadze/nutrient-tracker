// 1:1 TypeScript types for each SQLite table row.
// These match column names exactly — no camelCase conversion.

export interface FoodRow {
  id: string;
  name: string;
  brand: string | null;
  serving_size_g: number;
  serving_label: string;
  kcal_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  barcode: string | null;
  is_custom: 0 | 1;
  created_at: number;
}

export interface DiaryEntryRow {
  id: string;
  food_id: string;
  date: string;       // 'YYYY-MM-DD'
  meal_slot: MealSlot;
  servings: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: number;
}

export interface WeightLogRow {
  id: string;
  date: string;       // 'YYYY-MM-DD'
  weight_kg: number;
  note: string | null;
  created_at: number;
}

export interface TdeeHistoryRow {
  id: string;
  week_start: string; // 'YYYY-MM-DD' (Monday)
  estimated_tdee: number;
  confidence: number; // 0–1
  data_points: number;
  created_at: number;
}

export interface GoalsRow {
  id: string;
  sex: 'male' | 'female';
  age_years: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
  weekly_rate_kg: number;
  created_at: number;
  updated_at: number;
}

// Joined type used by diary queries
export interface DiaryEntryWithFood extends DiaryEntryRow {
  food: FoodRow;
}

// Shared domain enums
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose' | 'maintain' | 'gain';

export interface MacroTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
