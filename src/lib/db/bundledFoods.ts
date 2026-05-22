/**
 * Loads foods from the bundled assets/foods.db into the main nutrient.db.
 * Runs once on first launch (tracked via schema_migrations).
 * No-op if the bundled DB has no rows (placeholder before script is run).
 *
 * Requires metro.config.js to have 'db' in resolver.assetExts.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

const MIGRATION_KEY = 'bundled_foods_v1';

// Metro registers binary assets as numeric module IDs.
// The require() is resolved at build time; if the file doesn't exist
// (before the fetch script is run) Metro still includes a placeholder asset.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FOODS_DB_ASSET = require('../../../assets/foods.db') as number;

const SQLITE_DIR = `${FileSystem.documentDirectory}SQLite/`;

export async function loadBundledFoodsIfNeeded(mainDb: SQLiteDatabase): Promise<void> {
  const already = mainDb.getFirstSync<{ filename: string }>(
    'SELECT filename FROM schema_migrations WHERE filename = ?',
    [MIGRATION_KEY],
  );
  if (already) return;

  try {
    // expo-asset resolves the numeric module ID to a localUri.
    // Imported lazily to avoid a top-level dependency that Metro might
    // struggle to resolve during the initial bundle pass.
    const { Asset } = await import('expo-asset');
    const asset = Asset.fromModule(FOODS_DB_ASSET);
    await asset.downloadAsync();
    if (!asset.localUri) return;

    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });
    const destName = 'foods_bundled_tmp.db';
    const destPath = `${SQLITE_DIR}${destName}`;
    await FileSystem.copyAsync({ from: asset.localUri, to: destPath });

    const bundled = SQLite.openDatabaseSync(destName);
    const count = bundled.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM foods');

    if (count && count.n > 0) {
      const rows = bundled.getAllSync<{
        id: string; name: string; brand: string | null;
        serving_size_g: number; serving_label: string;
        kcal_per_serving: number; protein_g: number; carbs_g: number; fat_g: number;
        fiber_g: number | null; sugar_g: number | null; sodium_mg: number | null;
        barcode: string | null;
      }>('SELECT * FROM foods');

      mainDb.withTransactionSync(() => {
        for (const row of rows) {
          mainDb.runSync(
            `INSERT OR IGNORE INTO foods
               (id, name, brand, serving_size_g, serving_label,
                kcal_per_serving, protein_g, carbs_g, fat_g,
                fiber_g, sugar_g, sodium_mg, barcode, is_custom)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              row.id, row.name, row.brand,
              row.serving_size_g, row.serving_label,
              row.kcal_per_serving, row.protein_g, row.carbs_g, row.fat_g,
              row.fiber_g, row.sugar_g, row.sodium_mg, row.barcode,
            ],
          );
        }
        mainDb.runSync(`INSERT INTO foods_fts(foods_fts) VALUES('rebuild')`);
      });
    }

    mainDb.runSync(
      'INSERT OR IGNORE INTO schema_migrations (filename) VALUES (?)',
      [MIGRATION_KEY],
    );

    bundled.closeSync();
    await FileSystem.deleteAsync(destPath, { idempotent: true });
  } catch (e) {
    console.warn('[bundledFoods] failed:', e);
  }
}
