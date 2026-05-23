import type { SQLiteDatabase } from 'expo-sqlite';
import type { DiaryEntryRow, DiaryEntryWithFood, FoodRow, MacroTotals, MealSlot } from '../types';

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns all diary entries for a given date with their food data joined.
 * Ordered by created_at so entries appear in the order they were logged.
 */
export function getDiaryEntriesForDate(
  db: SQLiteDatabase,
  date: string,
): DiaryEntryWithFood[] {
  const rows = db.getAllSync<DiaryEntryRow & {
    food_id2: string; food_name: string; food_brand: string | null;
    food_serving_size_g: number; food_serving_label: string;
    food_kcal_per_serving: number; food_protein_g: number;
    food_carbs_g: number; food_fat_g: number;
    food_fiber_g: number | null; food_sugar_g: number | null;
    food_sodium_mg: number | null; food_barcode: string | null;
    food_is_custom: 0 | 1; food_created_at: number;
  }>(
    `SELECT
       de.*,
       f.id        AS food_id2,
       f.name      AS food_name,
       f.brand     AS food_brand,
       f.serving_size_g   AS food_serving_size_g,
       f.serving_label    AS food_serving_label,
       f.kcal_per_serving AS food_kcal_per_serving,
       f.protein_g  AS food_protein_g,
       f.carbs_g    AS food_carbs_g,
       f.fat_g      AS food_fat_g,
       f.fiber_g    AS food_fiber_g,
       f.sugar_g    AS food_sugar_g,
       f.sodium_mg  AS food_sodium_mg,
       f.barcode    AS food_barcode,
       f.is_custom  AS food_is_custom,
       f.created_at AS food_created_at
     FROM diary_entries de
     JOIN foods f ON f.id = de.food_id
     WHERE de.date = ?
     ORDER BY de.created_at ASC`,
    [date],
  );

  return rows.map(row => ({
    id: row.id,
    food_id: row.food_id,
    date: row.date,
    meal_slot: row.meal_slot as MealSlot,
    servings: row.servings,
    kcal: row.kcal,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    created_at: row.created_at,
    food: {
      id: row.food_id,
      name: row.food_name,
      brand: row.food_brand,
      serving_size_g: row.food_serving_size_g,
      serving_label: row.food_serving_label,
      kcal_per_serving: row.food_kcal_per_serving,
      protein_g: row.food_protein_g,
      carbs_g: row.food_carbs_g,
      fat_g: row.food_fat_g,
      fiber_g: row.food_fiber_g,
      sugar_g: row.food_sugar_g,
      sodium_mg: row.food_sodium_mg,
      barcode: row.food_barcode,
      is_custom: row.food_is_custom,
      created_at: row.food_created_at,
    },
  }));
}

/**
 * Returns summed macros for all diary entries on a given date.
 * Uses a single SQL aggregate — never JS reduce over rows.
 */
export function getDailyTotals(db: SQLiteDatabase, date: string): MacroTotals {
  const row = db.getFirstSync<MacroTotals>(
    `SELECT
       COALESCE(SUM(kcal),      0) AS kcal,
       COALESCE(SUM(protein_g), 0) AS protein_g,
       COALESCE(SUM(carbs_g),   0) AS carbs_g,
       COALESCE(SUM(fat_g),     0) AS fat_g
     FROM diary_entries
     WHERE date = ?`,
    [date],
  );
  return row ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

export function getRecentFoods(db: SQLiteDatabase, limit = 8): FoodRow[] {
  return db.getAllSync<FoodRow>(
    `SELECT f.*
     FROM foods f
     INNER JOIN (
       SELECT food_id, MAX(created_at) AS last_used
       FROM diary_entries
       GROUP BY food_id
       ORDER BY last_used DESC
       LIMIT ?
     ) recent ON recent.food_id = f.id
     ORDER BY recent.last_used DESC`,
    [limit],
  );
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export function insertDiaryEntry(
  db: SQLiteDatabase,
  entry: Omit<DiaryEntryRow, 'created_at'>,
): void {
  db.runSync(
    `INSERT INTO diary_entries
       (id, food_id, date, meal_slot, servings, kcal, protein_g, carbs_g, fat_g)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.food_id,
      entry.date,
      entry.meal_slot,
      entry.servings,
      entry.kcal,
      entry.protein_g,
      entry.carbs_g,
      entry.fat_g,
    ],
  );
}

export function deleteDiaryEntry(db: SQLiteDatabase, id: string): void {
  db.runSync('DELETE FROM diary_entries WHERE id = ?', [id]);
}

export function updateDiaryEntryServings(
  db: SQLiteDatabase,
  id: string,
  servings: number,
  updatedMacros: MacroTotals,
  mealSlot?: MealSlot,
): void {
  db.runSync(
    `UPDATE diary_entries
     SET servings = ?, kcal = ?, protein_g = ?, carbs_g = ?, fat_g = ?,
         meal_slot = COALESCE(?, meal_slot)
     WHERE id = ?`,
    [
      servings,
      updatedMacros.kcal,
      updatedMacros.protein_g,
      updatedMacros.carbs_g,
      updatedMacros.fat_g,
      mealSlot ?? null,
      id,
    ],
  );
}
