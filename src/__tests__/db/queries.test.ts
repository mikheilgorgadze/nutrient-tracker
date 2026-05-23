/**
 * DB query unit tests — uses the mock DB to verify SQL strings and parameters.
 * We do not run actual SQLite here (native module, not available in Jest/Node).
 * Integration with real SQL is verified manually by running the app.
 */
import { createMockDb } from '@/test/mocks/db';
import {
  searchFoods,
  getFoodById,
  insertFood,
  seedFoods,
} from '@/lib/db/queries/foods';
import {
  getDiaryEntriesForDate,
  insertDiaryEntry,
  deleteDiaryEntry,
  updateDiaryEntryServings,
  getDailyTotals,
  getRecentFoods,
} from '@/lib/db/queries/diary';
import {
  getGoals,
  upsertGoals,
} from '@/lib/db/queries/goals';
import {
  getWeightLog,
  upsertWeight,
  getLatestTdeeEstimate,
  insertTdeeHistory,
  getDiaryKcalByDate,
} from '@/lib/db/queries/progress';
import type { FoodRow, DiaryEntryRow, GoalsRow, WeightLogRow, TdeeHistoryRow } from '@/lib/db/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockFood: Omit<FoodRow, 'created_at'> = {
  id: 'food_test_001',
  name: 'Chicken Breast, cooked',
  brand: null,
  serving_size_g: 100,
  serving_label: '100g',
  kcal_per_serving: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
  fiber_g: 0,
  sugar_g: 0,
  sodium_mg: 74,
  barcode: null,
  is_custom: 0,
};

const mockEntry: Omit<DiaryEntryRow, 'created_at'> = {
  id: 'entry_test_001',
  food_id: 'food_test_001',
  date: '2026-05-06',
  meal_slot: 'lunch',
  servings: 1.5,
  kcal: 247.5,
  protein_g: 46.5,
  carbs_g: 0,
  fat_g: 5.4,
};

// ── Foods queries ────────────────────────────────────────────────────────────

describe('searchFoods', () => {
  it('returns empty array for terms shorter than 2 chars', () => {
    const db = createMockDb();
    expect(searchFoods(db as never, 'c')).toEqual([]);
    expect(db.getAllSync).not.toHaveBeenCalled();
  });

  it('returns empty array for empty string', () => {
    const db = createMockDb();
    expect(searchFoods(db as never, '')).toEqual([]);
  });

  it('calls getAllSync with FTS MATCH query', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([mockFood]);
    const result = searchFoods(db as never, 'chicken');
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('foods_fts MATCH'),
      expect.arrayContaining(['chicken*']),
    );
    expect(result).toEqual([mockFood]);
  });

  it('builds prefix query with asterisks for each word', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    searchFoods(db as never, 'chicken breast');
    const callArgs = db.getAllSync.mock.calls[0][1] as string[];
    expect(callArgs[0]).toBe('chicken* breast*');
  });

  it('sanitizes FTS special characters', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    searchFoods(db as never, 'chicken"breast');
    const callArgs = db.getAllSync.mock.calls[0][1] as string[];
    expect(callArgs[0]).not.toContain('"');
  });

  it('respects limit parameter', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    searchFoods(db as never, 'chicken', 10);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.any(String),
      ['chicken*', 10],
    );
  });
});

describe('getFoodById', () => {
  it('queries by id', () => {
    const db = createMockDb();
    db.getFirstSync.mockReturnValue(mockFood);
    const result = getFoodById(db as never, 'food_test_001');
    expect(db.getFirstSync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ?'),
      ['food_test_001'],
    );
    expect(result).toEqual(mockFood);
  });

  it('returns null when not found', () => {
    const db = createMockDb();
    db.getFirstSync.mockReturnValue(null);
    expect(getFoodById(db as never, 'nonexistent')).toBeNull();
  });
});

describe('insertFood', () => {
  it('calls runSync with all food fields', () => {
    const db = createMockDb();
    insertFood(db as never, mockFood);
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO foods'),
      expect.arrayContaining([mockFood.id, mockFood.name, mockFood.kcal_per_serving]),
    );
  });
});

describe('seedFoods', () => {
  it('wraps inserts in a transaction', () => {
    const db = createMockDb();
    seedFoods(db as never, [mockFood]);
    expect(db.withTransactionSync).toHaveBeenCalled();
  });
});

// ── Diary queries ────────────────────────────────────────────────────────────

describe('getDiaryEntriesForDate', () => {
  it('queries with the provided date', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getDiaryEntriesForDate(db as never, '2026-05-06');
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE de.date = ?'),
      ['2026-05-06'],
    );
  });
});

describe('insertDiaryEntry', () => {
  it('inserts with correct fields', () => {
    const db = createMockDb();
    insertDiaryEntry(db as never, mockEntry);
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO diary_entries'),
      expect.arrayContaining([mockEntry.id, mockEntry.food_id, mockEntry.date, mockEntry.meal_slot]),
    );
  });
});

describe('deleteDiaryEntry', () => {
  it('deletes by id', () => {
    const db = createMockDb();
    deleteDiaryEntry(db as never, 'entry_001');
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM diary_entries WHERE id = ?'),
      ['entry_001'],
    );
  });
});

describe('updateDiaryEntryServings', () => {
  it('updates servings and denormalized macros', () => {
    const db = createMockDb();
    updateDiaryEntryServings(db as never, 'entry_001', 2, { kcal: 330, protein_g: 62, carbs_g: 0, fat_g: 7.2 });
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('SET servings'),
      expect.arrayContaining([2, 330, 62, 0, 7.2, 'entry_001']),
    );
  });
});

describe('getRecentFoods', () => {
  it('returns empty array when no diary entries exist', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    const result = getRecentFoods(db as never);
    expect(result).toEqual([]);
  });

  it('calls getAllSync with a query joining diary_entries and foods', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([mockFood]);
    getRecentFoods(db as never);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('diary_entries'),
      expect.any(Array),
    );
  });

  it('passes the limit parameter to the query', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getRecentFoods(db as never, 5);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.any(String),
      [5],
    );
  });

  it('uses default limit of 8 when not specified', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getRecentFoods(db as never);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.any(String),
      [8],
    );
  });

  it('returns foods ordered by most recently used', () => {
    const db = createMockDb();
    const food2: typeof mockFood = { ...mockFood, id: 'food_002', name: 'Rice' };
    // getAllSync returns foods already ordered by the SQL query
    db.getAllSync.mockReturnValue([food2, mockFood]);
    const result = getRecentFoods(db as never);
    expect(result[0].id).toBe('food_002');
    expect(result[1].id).toBe('food_test_001');
  });
});

describe('getDailyTotals', () => {
  it('queries SUM aggregates for given date', () => {
    const db = createMockDb();
    db.getFirstSync.mockReturnValue({ kcal: 1500, protein_g: 120, carbs_g: 150, fat_g: 60 });
    const result = getDailyTotals(db as never, '2026-05-06');
    expect(db.getFirstSync).toHaveBeenCalledWith(
      expect.stringContaining('SUM(kcal)'),
      ['2026-05-06'],
    );
    expect(result.kcal).toBe(1500);
  });

  it('returns zeros when no entries exist', () => {
    const db = createMockDb();
    db.getFirstSync.mockReturnValue(null);
    const result = getDailyTotals(db as never, '2026-05-06');
    expect(result).toEqual({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  });
});

// ── Goals queries ────────────────────────────────────────────────────────────

describe('getGoals', () => {
  it('queries singleton row', () => {
    const db = createMockDb();
    db.getFirstSync.mockReturnValue(null);
    getGoals(db as never);
    expect(db.getFirstSync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ?'),
      ['singleton'],
    );
  });
});

describe('upsertGoals', () => {
  it('uses INSERT ... ON CONFLICT upsert pattern', () => {
    const db = createMockDb();
    const goals: Omit<GoalsRow, 'id' | 'created_at' | 'updated_at'> = {
      sex: 'male',
      age_years: 30,
      height_cm: 180,
      weight_kg: 80,
      activity_level: 'moderate',
      goal_type: 'maintain',
      weekly_rate_kg: 0,
    };
    upsertGoals(db as never, goals);
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT'),
      expect.arrayContaining(['male', 30, 180, 80]),
    );
  });
});

// ── Progress queries ──────────────────────────────────────────────────────────

describe('getWeightLog', () => {
  it('returns all entries ordered by date when no limit', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getWeightLog(db as never);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY date ASC'),
    );
  });

  it('adds date filter when days is provided', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getWeightLog(db as never, 30);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('date >='),
      ['-30 days'],
    );
  });
});

describe('upsertWeight', () => {
  it('upserts on date conflict', () => {
    const db = createMockDb();
    const entry: Omit<WeightLogRow, 'created_at'> = {
      id: 'w_001', date: '2026-05-06', weight_kg: 79.5, note: null,
    };
    upsertWeight(db as never, entry);
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(date)'),
      expect.arrayContaining(['2026-05-06', 79.5]),
    );
  });
});

describe('getLatestTdeeEstimate', () => {
  it('orders by week_start desc and limits to 1', () => {
    const db = createMockDb();
    db.getFirstSync.mockReturnValue(null);
    getLatestTdeeEstimate(db as never);
    expect(db.getFirstSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY week_start DESC LIMIT 1'),
    );
  });
});

describe('insertTdeeHistory', () => {
  it('upserts on week_start conflict', () => {
    const db = createMockDb();
    const row: Omit<TdeeHistoryRow, 'created_at'> = {
      id: 'tdee_001',
      week_start: '2026-01-05',
      estimated_tdee: 2150,
      confidence: 0.75,
      data_points: 7,
    };
    insertTdeeHistory(db as never, row);
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(week_start)'),
      expect.arrayContaining(['2026-01-05', 2150, 0.75, 7]),
    );
  });
});

describe('getDiaryKcalByDate', () => {
  it('groups by date with SUM', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getDiaryKcalByDate(db as never, 30);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY date'),
      ['-30 days'],
    );
  });
});
