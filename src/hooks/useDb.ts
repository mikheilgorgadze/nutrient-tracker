import { useEffect, useState } from 'react';
import { getDb } from '@/lib/db';
import type { SQLiteDatabase } from '@/lib/db';

let _cached: SQLiteDatabase | null = null;

/**
 * Returns the initialized DB singleton.
 * Suspends (returns null) on the very first call while the DB opens and
 * migrations run. All subsequent calls return the instance synchronously
 * because getDb() is itself synchronous after the first call.
 */
export function useDb(): SQLiteDatabase | null {
  const [db, setDb] = useState<SQLiteDatabase | null>(() => {
    try {
      if (_cached) return _cached;
      _cached = getDb();
      return _cached;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (db) return;
    try {
      _cached = getDb();
      setDb(_cached);
    } catch (e) {
      console.error('[useDb] failed to open database:', e);
    }
  }, [db]);

  return db;
}
