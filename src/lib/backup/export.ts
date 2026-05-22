import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

const BACKUP_VERSION = 1;

export async function exportBackup(db: SQLiteDatabase): Promise<void> {
  const goals    = db.getAllSync('SELECT * FROM goals');
  const foods    = db.getAllSync('SELECT * FROM foods WHERE is_custom = 1');
  const diary    = db.getAllSync('SELECT * FROM diary_entries');
  const weight   = db.getAllSync('SELECT * FROM weight_log');
  const tdee     = db.getAllSync('SELECT * FROM tdee_history');

  const payload = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    goals,
    custom_foods: foods,
    diary_entries: diary,
    weight_log: weight,
    tdee_history: tdee,
  };

  const json = JSON.stringify(payload, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const path = `${FileSystem.cacheDirectory}nutrient-backup-${date}.json`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save backup' });
  await FileSystem.deleteAsync(path, { idempotent: true });
}
