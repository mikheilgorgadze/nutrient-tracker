-- Core schema: all 5 domain tables.

CREATE TABLE IF NOT EXISTS foods (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  brand           TEXT,
  serving_size_g  REAL NOT NULL,          -- grams in one "serving"
  serving_label   TEXT NOT NULL,          -- human label e.g. "100g", "1 large egg"
  kcal_per_serving REAL NOT NULL,
  protein_g       REAL NOT NULL,
  carbs_g         REAL NOT NULL,
  fat_g           REAL NOT NULL,
  fiber_g         REAL,
  sugar_g         REAL,
  sodium_mg       REAL,
  is_custom       INTEGER NOT NULL DEFAULT 0,  -- 0 = seeded/USDA, 1 = user-created or AI estimate
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_foods_name    ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(id) WHERE is_custom = 0;

CREATE TABLE IF NOT EXISTS diary_entries (
  id         TEXT PRIMARY KEY,
  food_id    TEXT NOT NULL REFERENCES foods(id),
  date       TEXT NOT NULL,              -- ISO date 'YYYY-MM-DD'
  meal_slot  TEXT NOT NULL,             -- 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  servings   REAL NOT NULL DEFAULT 1,
  -- Denormalized macros (servings * food macros) for fast daily totals
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
  date       TEXT NOT NULL UNIQUE,       -- one entry per calendar day
  weight_kg  REAL NOT NULL,
  note       TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_log(date);

CREATE TABLE IF NOT EXISTS tdee_history (
  id             TEXT PRIMARY KEY,
  week_start     TEXT NOT NULL UNIQUE,   -- ISO date of Monday
  estimated_tdee REAL NOT NULL,
  confidence     REAL NOT NULL DEFAULT 0, -- 0–1
  data_points    INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS goals (
  id               TEXT PRIMARY KEY DEFAULT 'singleton',
  sex              TEXT NOT NULL,          -- 'male' | 'female'
  age_years        INTEGER NOT NULL,
  height_cm        REAL NOT NULL,
  weight_kg        REAL NOT NULL,
  activity_level   TEXT NOT NULL,          -- 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal_type        TEXT NOT NULL,          -- 'lose' | 'maintain' | 'gain'
  weekly_rate_kg   REAL NOT NULL DEFAULT 0.5,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);
