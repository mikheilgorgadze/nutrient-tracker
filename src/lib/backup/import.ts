import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { SQLiteDatabase } from 'expo-sqlite';

export type ImportResult =
  | { ok: true; counts: { diary: number; weight: number; foods: number } }
  | { ok: false; error: string };

// Backup rows are plain JSON — cast each field explicitly before passing to SQLite.
type AnyRow = Record<string, unknown>;
type Param = string | number | null;
function s(v: unknown): string  { return String(v ?? '') }
function n(v: unknown): number  { return Number(v ?? 0) }
function p(v: unknown): Param   { return v == null ? null : typeof v === 'number' ? v : String(v) }

export async function importBackup(db: SQLiteDatabase): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { ok: false, error: 'cancelled' };
  }

  const uri = result.assets[0].uri;
  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return { ok: false, error: 'Could not read the file.' };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (!payload.version || !payload.diary_entries) {
    return { ok: false, error: 'Not a NutrientTracker backup file.' };
  }

  try {
    db.withTransactionSync(() => {
      // Goals
      if (Array.isArray(payload.goals)) {
        for (const g of payload.goals as AnyRow[]) {
          db.runSync(
            `INSERT OR REPLACE INTO goals
               (id, sex, age_years, height_cm, weight_kg, activity_level,
                goal_type, weekly_rate_kg, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            s(g.id), s(g.sex), n(g.age_years), n(g.height_cm), n(g.weight_kg),
            s(g.activity_level), s(g.goal_type), n(g.weekly_rate_kg),
            n(g.created_at), n(g.updated_at),
          );
        }
      }

      // Custom foods (restore before diary since diary FKs foods)
      if (Array.isArray(payload.custom_foods)) {
        for (const f of payload.custom_foods as AnyRow[]) {
          db.runSync(
            `INSERT OR IGNORE INTO foods
               (id, name, brand, serving_size_g, serving_label,
                kcal_per_serving, protein_g, carbs_g, fat_g,
                fiber_g, sugar_g, sodium_mg, barcode, is_custom, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            s(f.id), s(f.name), p(f.brand), n(f.serving_size_g), s(f.serving_label),
            n(f.kcal_per_serving), n(f.protein_g), n(f.carbs_g), n(f.fat_g),
            p(f.fiber_g), p(f.sugar_g), p(f.sodium_mg), p(f.barcode), n(f.created_at),
          );
        }
      }

      // Diary entries
      if (Array.isArray(payload.diary_entries)) {
        for (const e of payload.diary_entries as AnyRow[]) {
          db.runSync(
            `INSERT OR IGNORE INTO diary_entries
               (id, food_id, date, meal_slot, servings,
                kcal, protein_g, carbs_g, fat_g, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            s(e.id), s(e.food_id), s(e.date), s(e.meal_slot), n(e.servings),
            n(e.kcal), n(e.protein_g), n(e.carbs_g), n(e.fat_g), n(e.created_at),
          );
        }
      }

      // Weight log
      if (Array.isArray(payload.weight_log)) {
        for (const w of payload.weight_log as AnyRow[]) {
          db.runSync(
            `INSERT OR IGNORE INTO weight_log (id, date, weight_kg, note, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            s(w.id), s(w.date), n(w.weight_kg), p(w.note), n(w.created_at),
          );
        }
      }

      // TDEE history
      if (Array.isArray(payload.tdee_history)) {
        for (const t of payload.tdee_history as AnyRow[]) {
          db.runSync(
            `INSERT OR IGNORE INTO tdee_history
               (id, week_start, estimated_tdee, confidence, data_points, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            s(t.id), s(t.week_start), n(t.estimated_tdee),
            n(t.confidence), n(t.data_points), n(t.created_at),
          );
        }
      }
    });

    return {
      ok: true,
      counts: {
        diary:  (payload.diary_entries as unknown[]).length,
        weight: (payload.weight_log   as unknown[]).length,
        foods:  (payload.custom_foods as unknown[]).length,
      },
    };
  } catch (e) {
    return { ok: false, error: `Import failed: ${(e as Error).message}` };
  }
}
