// Migration SQL strings exported as TypeScript constants.
// Metro bundler cannot read arbitrary files at runtime in managed Expo,
// so we re-export each .sql file's content here as a string.
// The .sql files remain the source of truth for readability.

export const MIGRATION_001 = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);
` as const;

export const MIGRATION_002 = `
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
  is_custom        INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

CREATE TABLE IF NOT EXISTS diary_entries (
  id         TEXT PRIMARY KEY,
  food_id    TEXT NOT NULL REFERENCES foods(id),
  date       TEXT NOT NULL,
  meal_slot  TEXT NOT NULL,
  servings   REAL NOT NULL DEFAULT 1,
  kcal       REAL NOT NULL,
  protein_g  REAL NOT NULL,
  carbs_g    REAL NOT NULL,
  fat_g      REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(date);
CREATE INDEX IF NOT EXISTS idx_diary_food ON diary_entries(food_id);

CREATE TABLE IF NOT EXISTS weight_log (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,
  weight_kg  REAL NOT NULL,
  note       TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_log(date);

CREATE TABLE IF NOT EXISTS tdee_history (
  id             TEXT PRIMARY KEY,
  week_start     TEXT NOT NULL UNIQUE,
  estimated_tdee REAL NOT NULL,
  confidence     REAL NOT NULL DEFAULT 0,
  data_points    INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS goals (
  id             TEXT PRIMARY KEY DEFAULT 'singleton',
  sex            TEXT NOT NULL,
  age_years      INTEGER NOT NULL,
  height_cm      REAL NOT NULL,
  weight_kg      REAL NOT NULL,
  activity_level TEXT NOT NULL,
  goal_type      TEXT NOT NULL,
  weekly_rate_kg REAL NOT NULL DEFAULT 0.5,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);
` as const;

export const MIGRATION_003 = `
CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
  name,
  brand,
  content='foods',
  content_rowid='rowid'
);

INSERT INTO foods_fts(foods_fts) VALUES('rebuild');

CREATE TRIGGER IF NOT EXISTS foods_ai AFTER INSERT ON foods BEGIN
  INSERT INTO foods_fts(rowid, name, brand)
  VALUES (new.rowid, new.name, new.brand);
END;

CREATE TRIGGER IF NOT EXISTS foods_ad AFTER DELETE ON foods BEGIN
  INSERT INTO foods_fts(foods_fts, rowid, name, brand)
  VALUES ('delete', old.rowid, old.name, old.brand);
END;

CREATE TRIGGER IF NOT EXISTS foods_au AFTER UPDATE ON foods BEGIN
  INSERT INTO foods_fts(foods_fts, rowid, name, brand)
  VALUES ('delete', old.rowid, old.name, old.brand);
  INSERT INTO foods_fts(rowid, name, brand)
  VALUES (new.rowid, new.name, new.brand);
END;
` as const;

export const MIGRATION_004 = `
ALTER TABLE foods ADD COLUMN barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
` as const;

export const MIGRATION_005 = `
CREATE TABLE IF NOT EXISTS meal_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS meal_template_items (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  servings REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
` as const;

export const MIGRATIONS: Array<{ filename: string; sql: string }> = [
  { filename: '001_initial.sql',     sql: MIGRATION_001 },
  { filename: '002_core_schema.sql', sql: MIGRATION_002 },
  { filename: '003_foods_fts.sql',   sql: MIGRATION_003 },
  { filename: '004_barcode.sql',     sql: MIGRATION_004 },
  { filename: '005_templates.sql',   sql: MIGRATION_005 },
];
