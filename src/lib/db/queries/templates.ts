import type { SQLiteDatabase } from 'expo-sqlite';
import type { FoodRow } from '../types';
import { newId } from '../index';

export interface TemplateRow {
  id: string;
  name: string;
  created_at: number;
}

export interface TemplateItemWithFood {
  id: string;
  template_id: string;
  food_id: string;
  servings: number;
  food: FoodRow;
}

export function getTemplates(db: SQLiteDatabase): TemplateRow[] {
  return db.getAllSync<TemplateRow>('SELECT * FROM meal_templates ORDER BY created_at DESC');
}

export function getTemplateItems(db: SQLiteDatabase, templateId: string): TemplateItemWithFood[] {
  const rows = db.getAllSync<{
    id: string;
    template_id: string;
    food_id: string;
    servings: number;
    created_at: number;
    food_id2: string;
    food_name: string;
    food_brand: string | null;
    food_serving_size_g: number;
    food_serving_label: string;
    food_kcal_per_serving: number;
    food_protein_g: number;
    food_carbs_g: number;
    food_fat_g: number;
    food_fiber_g: number | null;
    food_sugar_g: number | null;
    food_sodium_mg: number | null;
    food_barcode: string | null;
    food_is_custom: 0 | 1;
    food_created_at: number;
  }>(
    `SELECT
       mti.*,
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
     FROM meal_template_items mti
     JOIN foods f ON f.id = mti.food_id
     WHERE mti.template_id = ?
     ORDER BY mti.created_at ASC`,
    [templateId],
  );

  return rows.map(row => ({
    id: row.id,
    template_id: row.template_id,
    food_id: row.food_id,
    servings: row.servings,
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

export function saveTemplate(
  db: SQLiteDatabase,
  name: string,
  items: Array<{ food_id: string; servings: number }>,
): string {
  const templateId = newId();
  db.withTransactionSync(() => {
    db.runSync('INSERT INTO meal_templates (id, name) VALUES (?, ?)', [templateId, name]);
    for (const item of items) {
      db.runSync(
        'INSERT INTO meal_template_items (id, template_id, food_id, servings) VALUES (?, ?, ?, ?)',
        [newId(), templateId, item.food_id, item.servings],
      );
    }
  });
  return templateId;
}

export function deleteTemplate(db: SQLiteDatabase, id: string): void {
  db.runSync('DELETE FROM meal_templates WHERE id = ?', [id]);
}
