import type { SQLiteDatabase } from 'expo-sqlite';
import type { FoodRow } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sanitizes a search term for use in FTS5 MATCH queries.
 * Strips special FTS5 syntax characters, then appends * to each word
 * for prefix matching (e.g. "chick" matches "chicken").
 */
function buildFtsQuery(term: string): string {
  const sanitized = term.replace(/['"*^()]/g, ' ').trim();
  if (!sanitized) return '';
  return sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map(word => `${word}*`)
    .join(' ');
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Full-text search over food name and brand using FTS5.
 * Returns up to `limit` results ordered by FTS rank.
 * Returns empty array if term is fewer than 2 characters.
 */
export function searchFoods(
  db: SQLiteDatabase,
  term: string,
  limit = 50,
): FoodRow[] {
  if (term.trim().length < 2) return [];

  const ftsQuery = buildFtsQuery(term);
  if (!ftsQuery) return [];

  return db.getAllSync<FoodRow>(
    `SELECT f.*
     FROM foods f
     JOIN foods_fts ON f.rowid = foods_fts.rowid
     WHERE foods_fts MATCH ?
     ORDER BY foods_fts.rank
     LIMIT ?`,
    [ftsQuery, limit],
  );
}

export function getFoodById(db: SQLiteDatabase, id: string): FoodRow | null {
  return db.getFirstSync<FoodRow>(
    'SELECT * FROM foods WHERE id = ?',
    [id],
  );
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export function getFoodByBarcode(db: SQLiteDatabase, barcode: string): FoodRow | null {
  return db.getFirstSync<FoodRow>(
    'SELECT * FROM foods WHERE barcode = ? LIMIT 1',
    [barcode],
  );
}

export function insertFood(
  db: SQLiteDatabase,
  food: Omit<FoodRow, 'created_at'>,
): void {
  db.runSync(
    `INSERT OR IGNORE INTO foods
       (id, name, brand, serving_size_g, serving_label,
        kcal_per_serving, protein_g, carbs_g, fat_g,
        fiber_g, sugar_g, sodium_mg, barcode, is_custom)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      food.id,
      food.name,
      food.brand ?? null,
      food.serving_size_g,
      food.serving_label,
      food.kcal_per_serving,
      food.protein_g,
      food.carbs_g,
      food.fat_g,
      food.fiber_g ?? null,
      food.sugar_g ?? null,
      food.sodium_mg ?? null,
      food.barcode ?? null,
      food.is_custom,
    ],
  );
}

export function getCustomFoods(db: SQLiteDatabase): FoodRow[] {
  return db.getAllSync<FoodRow>(
    'SELECT * FROM foods WHERE is_custom = 1 ORDER BY created_at DESC',
  );
}

export function updateFood(
  db: SQLiteDatabase,
  id: string,
  fields: Pick<FoodRow, 'name' | 'brand' | 'serving_size_g' | 'serving_label' | 'kcal_per_serving' | 'protein_g' | 'carbs_g' | 'fat_g'>,
): void {
  db.runSync(
    `UPDATE foods SET
       name = ?, brand = ?, serving_size_g = ?, serving_label = ?,
       kcal_per_serving = ?, protein_g = ?, carbs_g = ?, fat_g = ?
     WHERE id = ? AND is_custom = 1`,
    [
      fields.name, fields.brand ?? null, fields.serving_size_g, fields.serving_label,
      fields.kcal_per_serving, fields.protein_g, fields.carbs_g, fields.fat_g,
      id,
    ],
  );
}

// Deletes the food and any diary entries that reference it (transaction).
export function deleteCustomFood(db: SQLiteDatabase, id: string): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM diary_entries WHERE food_id = ?', [id]);
    db.runSync('DELETE FROM foods WHERE id = ? AND is_custom = 1', [id]);
  });
}

/**
 * Inserts an array of foods in a single transaction.
 * Idempotent — uses INSERT OR IGNORE so re-runs are safe.
 */
export function seedFoods(
  db: SQLiteDatabase,
  foods: Array<Omit<FoodRow, 'created_at'>>,
): void {
  db.withTransactionSync(() => {
    for (const food of foods) {
      insertFood(db, food);
    }
  });
}
