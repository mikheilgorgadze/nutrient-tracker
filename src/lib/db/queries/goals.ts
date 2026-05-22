import type { SQLiteDatabase } from 'expo-sqlite';
import type { GoalsRow } from '../types';

export function getGoals(db: SQLiteDatabase): GoalsRow | null {
  return db.getFirstSync<GoalsRow>('SELECT * FROM goals WHERE id = ?', ['singleton']);
}

export function upsertGoals(
  db: SQLiteDatabase,
  goals: Omit<GoalsRow, 'id' | 'created_at' | 'updated_at'>,
): void {
  const now = Math.floor(Date.now() / 1000);
  db.runSync(
    `INSERT INTO goals
       (id, sex, age_years, height_cm, weight_kg,
        activity_level, goal_type, weekly_rate_kg,
        created_at, updated_at)
     VALUES ('singleton', ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       sex            = excluded.sex,
       age_years      = excluded.age_years,
       height_cm      = excluded.height_cm,
       weight_kg      = excluded.weight_kg,
       activity_level = excluded.activity_level,
       goal_type      = excluded.goal_type,
       weekly_rate_kg = excluded.weekly_rate_kg,
       updated_at     = excluded.updated_at`,
    [
      goals.sex,
      goals.age_years,
      goals.height_cm,
      goals.weight_kg,
      goals.activity_level,
      goals.goal_type,
      goals.weekly_rate_kg,
      now,
      now,
    ],
  );
}
