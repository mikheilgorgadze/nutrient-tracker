/**
 * fetch-foods.mjs
 *
 * Downloads USDA FoodData Central data and builds assets/foods.db
 * Run once before building the app:
 *
 *   node scripts/fetch-foods.mjs YOUR_USDA_API_KEY
 *
 * Get a free API key in ~30 seconds at:
 *   https://fdc.nal.usda.gov/api-key-signup
 *
 * What it fetches:
 *   - Foundation Foods  (~1,100 items — USDA's highest-quality dataset)
 *   - SR Legacy         (~7,700 items — comprehensive whole foods)
 *   - FNDDS             (~7,600 items — What We Eat in America survey foods)
 * Total: ~16,000 unique foods, stored in assets/foods.db (~6 MB).
 *
 * The app opens this file as a read-only reference DB on first launch and
 * copies all rows into the user's main nutrient.db.
 */

import Database from 'better-sqlite3';
import { createWriteStream, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error('Usage: node scripts/fetch-foods.mjs YOUR_USDA_API_KEY');
  console.error('Get a free key at https://fdc.nal.usda.gov/api-key-signup');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(ROOT, 'assets', 'foods.db');

const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
const PAGE_SIZE = 200;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// ─── USDA nutrient number strings (the "number" field in API responses) ───────
// "208" = Energy (standard, used in SR Legacy / FNDDS)
// "957" = Energy, Atwater General Factors (used in Foundation foods)
const NUTRIENT_KCAL    = ['208', '957'];
const NUTRIENT_PROTEIN = ['203'];
const NUTRIENT_CARBS   = ['205'];
const NUTRIENT_FAT     = ['204'];
const NUTRIENT_FIBER   = ['291'];
const NUTRIENT_SUGAR   = ['269'];
const NUTRIENT_SODIUM  = ['307'];

function pickNutrient(nutrients, numbers) {
  for (const num of numbers) {
    const n = nutrients.find(n => n.number === String(num));
    if (n?.amount != null) return n.amount;
  }
  return null;
}

// ─── DB setup ────────────────────────────────────────────────────────────────

function createDb() {
  mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  const db = new Database(OUT_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS foods (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      brand            TEXT,
      serving_size_g   REAL NOT NULL,
      serving_label    TEXT NOT NULL,
      kcal_per_serving REAL NOT NULL,
      protein_g        REAL NOT NULL,
      carbs_g          REAL NOT NULL,
      fat_g            REAL NOT NULL,
      fiber_g          REAL,
      sugar_g          REAL,
      sodium_mg        REAL,
      barcode          TEXT,
      is_custom        INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_name ON foods(name);
    CREATE INDEX IF NOT EXISTS idx_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
  `);
  return db;
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchPage(dataType, pageNumber) {
  const url = `${BASE_URL}/foods/list?api_key=${API_KEY}&dataType=${encodeURIComponent(dataType)}&pageSize=${PAGE_SIZE}&pageNumber=${pageNumber}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${dataType} page ${pageNumber}`);
  return res.json();
}

function normalizeFood(item) {
  const nutrients = item.foodNutrients ?? [];

  const kcal    = pickNutrient(nutrients, NUTRIENT_KCAL)    ?? 0;
  const protein = pickNutrient(nutrients, NUTRIENT_PROTEIN) ?? 0;
  const carbs   = pickNutrient(nutrients, NUTRIENT_CARBS)   ?? 0;
  const fat     = pickNutrient(nutrients, NUTRIENT_FAT)     ?? 0;
  const fiber   = pickNutrient(nutrients, NUTRIENT_FIBER);
  const sugar   = pickNutrient(nutrients, NUTRIENT_SUGAR);
  const sodium  = pickNutrient(nutrients, NUTRIENT_SODIUM);

  // USDA data is typically per 100 g
  const serving_size_g = item.servingSize ?? 100;
  const serving_label  = item.servingSizeUnit
    ? `${serving_size_g}${item.servingSizeUnit}`
    : '100g';

  return {
    id:               `usda_${item.fdcId}`,
    name:             (item.description ?? '').trim(),
    brand:            item.brandOwner ?? item.brandName ?? null,
    serving_size_g,
    serving_label,
    kcal_per_serving: Math.round(kcal * 10) / 10,
    protein_g:        Math.round(protein * 10) / 10,
    carbs_g:          Math.round(carbs * 10) / 10,
    fat_g:            Math.round(fat * 10) / 10,
    fiber_g:          fiber !== null ? Math.round(fiber * 10) / 10 : null,
    sugar_g:          sugar !== null ? Math.round(sugar * 10) / 10 : null,
    sodium_mg:        sodium !== null ? Math.round(sodium * 10) / 10 : null,
    barcode:          item.gtinUpc ?? null,
    is_custom:        0,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Building ${OUT_PATH} …\n`);
  const db = createDb();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO foods
      (id, name, brand, serving_size_g, serving_label,
       kcal_per_serving, protein_g, carbs_g, fat_g,
       fiber_g, sugar_g, sodium_mg, barcode, is_custom)
    VALUES
      (@id, @name, @brand, @serving_size_g, @serving_label,
       @kcal_per_serving, @protein_g, @carbs_g, @fat_g,
       @fiber_g, @sugar_g, @sodium_mg, @barcode, @is_custom)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  let total = 0;

  for (const dataType of DATA_TYPES) {
    console.log(`Fetching ${dataType}…`);
    let page = 1;
    let fetched = 0;

    while (true) {
      process.stdout.write(`  page ${page}… `);
      let items;
      try {
        items = await fetchPage(dataType, page);
      } catch (e) {
        console.error(`\nError: ${e.message}`);
        break;
      }
      if (!items || items.length === 0) { console.log('done.'); break; }

      const rows = items
        .map(normalizeFood)
        .filter(f => f.name && f.kcal_per_serving > 0);

      insertMany(rows);
      fetched += rows.length;
      total   += rows.length;
      console.log(`${rows.length} rows`);

      if (items.length < PAGE_SIZE) { console.log(`  → ${fetched} total for ${dataType}`); break; }
      page++;

      // Polite delay to avoid rate-limiting
      await new Promise(r => setTimeout(r, 250));
    }
  }

  const count = db.prepare('SELECT COUNT(*) AS n FROM foods').get();
  console.log(`\nDone. ${count.n} foods in ${OUT_PATH}`);
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
