/**
 * Mock factory for expo-sqlite's SQLiteDatabase interface.
 * Use this in unit tests that need a DB without opening a real file.
 *
 * For integration tests that need real SQL, open an in-memory DB instead:
 *   import * as SQLite from 'expo-sqlite';
 *   const db = SQLite.openDatabaseSync(':memory:');
 */
export function createMockDb() {
  return {
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllSync: jest.fn().mockReturnValue([]),
    getFirstSync: jest.fn().mockReturnValue(null),
    runSync: jest.fn().mockReturnValue({ lastInsertRowId: 1, changes: 1 }),
    execSync: jest.fn().mockReturnValue(undefined),
    closeAsync: jest.fn().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
    withTransactionSync: jest.fn().mockImplementation((fn: () => void) => fn()),
  };
}

export type MockDb = ReturnType<typeof createMockDb>;
