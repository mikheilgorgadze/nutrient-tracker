import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, MIGRATION_001 } from './migrations';
import { runSeed } from './seeds/runSeed';

export type { SQLiteDatabase } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

// ─── Singleton ───────────────────────────────────────────────────────────────

let _db: SQLiteDatabase | null = null;

/**
 * Returns the initialized SQLite database singleton.
 * Opens the DB and runs pending migrations on first call.
 * Subsequent calls return the cached instance immediately.
 */
export function getDb(): SQLiteDatabase {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync('nutrient.db');
  runMigrations(_db);
  runSeed(_db);
  return _db;
}

/**
 * Async post-init step: copies bundled foods.db asset into the main DB.
 * Call once from the root layout after the DB is ready.
 * Safe to call multiple times (idempotent via schema_migrations).
 */
export async function initBundledFoods(): Promise<void> {
  const { loadBundledFoodsIfNeeded } = await import('./bundledFoods');
  await loadBundledFoodsIfNeeded(getDb());
}

// ─── Migration runner ────────────────────────────────────────────────────────

function runMigrations(db: SQLiteDatabase): void {
  // Bootstrap: always ensure schema_migrations exists first.
  // MIGRATION_001 uses IF NOT EXISTS so it's safe to run every time.
  db.execSync(MIGRATION_001);

  // Find which migrations have already been applied.
  const applied = new Set(
    db.getAllSync<{ filename: string }>(
      'SELECT filename FROM schema_migrations',
    ).map(r => r.filename),
  );

  // Run each pending migration inside its own transaction.
  for (const { filename, sql } of MIGRATIONS) {
    if (applied.has(filename)) continue;

    db.withTransactionSync(() => {
      db.execSync(sql);
      db.runSync(
        'INSERT INTO schema_migrations (filename) VALUES (?)',
        [filename],
      );
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns today's date as 'YYYY-MM-DD' in local time. */
export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Generates a UUID v4 string for use as a row ID. */
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
