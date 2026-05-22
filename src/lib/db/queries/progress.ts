import type { SQLiteDatabase } from 'expo-sqlite';
import type { TdeeHistoryRow, WeightLogRow } from '../types';

// ─── Weight log ───────────────────────────────────────────────────────────────

/**
 * Returns weight log entries ordered oldest-first.
 * @param days  If provided, limits to the last N calendar days.
 */
export function getWeightLog(
  db: SQLiteDatabase,
  days?: number,
): WeightLogRow[] {
  if (days !== undefined) {
    return db.getAllSync<WeightLogRow>(
      `SELECT * FROM weight_log
       WHERE date >= date('now', ?)
       ORDER BY date ASC`,
      [`-${days} days`],
    );
  }
  return db.getAllSync<WeightLogRow>(
    'SELECT * FROM weight_log ORDER BY date ASC',
  );
}

export function upsertWeight(
  db: SQLiteDatabase,
  entry: Omit<WeightLogRow, 'created_at'>,
): void {
  const now = Math.floor(Date.now() / 1000);
  db.runSync(
    `INSERT INTO weight_log (id, date, weight_kg, note, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       weight_kg  = excluded.weight_kg,
       note       = excluded.note`,
    [entry.id, entry.date, entry.weight_kg, entry.note ?? null, now],
  );
}

// ─── Diary kcal by date ───────────────────────────────────────────────────────

/**
 * Returns one row per date with the total kcal logged, for the last N days.
 * Dates with no diary entries are omitted.
 */
export function getDiaryKcalByDate(
  db: SQLiteDatabase,
  days: number,
): { date: string; kcal: number }[] {
  return db.getAllSync<{ date: string; kcal: number }>(
    `SELECT date, SUM(kcal) AS kcal
     FROM diary_entries
     WHERE date >= date('now', ?)
     GROUP BY date
     ORDER BY date ASC`,
    [`-${days} days`],
  );
}

// ─── TDEE history ─────────────────────────────────────────────────────────────

export function getLatestTdeeEstimate(
  db: SQLiteDatabase,
): TdeeHistoryRow | null {
  return db.getFirstSync<TdeeHistoryRow>(
    'SELECT * FROM tdee_history ORDER BY week_start DESC LIMIT 1',
  );
}

export function insertTdeeHistory(
  db: SQLiteDatabase,
  row: Omit<TdeeHistoryRow, 'created_at'>,
): void {
  const now = Math.floor(Date.now() / 1000);
  db.runSync(
    `INSERT INTO tdee_history
       (id, week_start, estimated_tdee, confidence, data_points, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(week_start) DO UPDATE SET
       estimated_tdee = excluded.estimated_tdee,
       confidence     = excluded.confidence,
       data_points    = excluded.data_points`,
    [
      row.id,
      row.week_start,
      row.estimated_tdee,
      row.confidence,
      row.data_points,
      now,
    ],
  );
}
