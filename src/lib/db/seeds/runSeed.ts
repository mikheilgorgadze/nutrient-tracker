import type { SQLiteDatabase } from 'expo-sqlite';
import { seedFoods } from '../queries/foods';
import { FOODS_SEED } from './foods_seed';

/**
 * Seeds the foods table with USDA-based common food data.
 * Idempotent: skips entirely if any non-custom foods already exist.
 */
export function runSeed(db: SQLiteDatabase): void {
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM foods WHERE is_custom = 0',
  );
  if (row && row.count > 0) return;
  seedFoods(db, FOODS_SEED);
}
