/**
 * DB query unit tests for meal templates.
 * Uses mock DB to verify SQL strings and parameters.
 */
import { createMockDb } from '@/test/mocks/db';
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  getTemplateItems,
} from '@/lib/db/queries/templates';

// Mock newId so we can verify generated IDs are used
jest.mock('@/lib/db/index', () => ({
  newId: jest.fn().mockReturnValue('mock-uuid'),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getTemplates', () => {
  it('returns empty array when no templates exist', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    const result = getTemplates(db as never);
    expect(result).toEqual([]);
  });

  it('calls getAllSync with ORDER BY created_at DESC', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getTemplates(db as never);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC'),
    );
  });

  it('queries meal_templates table', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([{ id: 'tpl_001', name: 'My breakfast', created_at: 1000 }]);
    const result = getTemplates(db as never);
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('meal_templates'),
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('My breakfast');
  });
});

describe('saveTemplate', () => {
  it('wraps inserts in a transaction', () => {
    const db = createMockDb();
    saveTemplate(db as never, 'My template', [{ food_id: 'food_001', servings: 2 }]);
    expect(db.withTransactionSync).toHaveBeenCalled();
  });

  it('inserts template row with name', () => {
    const db = createMockDb();
    saveTemplate(db as never, 'My template', []);
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO meal_templates'),
      expect.arrayContaining(['My template']),
    );
  });

  it('inserts item rows for each food', () => {
    const db = createMockDb();
    saveTemplate(db as never, 'Test', [
      { food_id: 'food_001', servings: 1 },
      { food_id: 'food_002', servings: 2.5 },
    ]);
    const runSyncCalls = db.runSync.mock.calls;
    // First call inserts the template, subsequent calls insert items
    const itemInsertCalls = runSyncCalls.filter(call =>
      (call[0] as string).includes('INSERT INTO meal_template_items')
    );
    expect(itemInsertCalls).toHaveLength(2);
    expect(itemInsertCalls[0][1]).toEqual(expect.arrayContaining(['food_001', 1]));
    expect(itemInsertCalls[1][1]).toEqual(expect.arrayContaining(['food_002', 2.5]));
  });

  it('returns the template id', () => {
    const db = createMockDb();
    const id = saveTemplate(db as never, 'Test', []);
    expect(id).toBe('mock-uuid');
  });
});

describe('deleteTemplate', () => {
  it('calls runSync with DELETE query', () => {
    const db = createMockDb();
    deleteTemplate(db as never, 'tpl_001');
    expect(db.runSync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM meal_templates WHERE id = ?'),
      ['tpl_001'],
    );
  });
});

describe('getTemplateItems', () => {
  it('calls getAllSync with JOIN query for template id', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getTemplateItems(db as never, 'tpl_001');
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('JOIN foods'),
      ['tpl_001'],
    );
  });

  it('filters by template_id', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    getTemplateItems(db as never, 'tpl_abc');
    expect(db.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE mti.template_id = ?'),
      ['tpl_abc'],
    );
  });

  it('returns empty array when no items', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    const result = getTemplateItems(db as never, 'tpl_001');
    expect(result).toEqual([]);
  });

  it('maps flat row to nested food object', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([{
      id: 'item_001',
      template_id: 'tpl_001',
      food_id: 'food_001',
      servings: 1.5,
      created_at: 1000,
      food_id2: 'food_001',
      food_name: 'Chicken Breast',
      food_brand: null,
      food_serving_size_g: 100,
      food_serving_label: '100g',
      food_kcal_per_serving: 165,
      food_protein_g: 31,
      food_carbs_g: 0,
      food_fat_g: 3.6,
      food_fiber_g: null,
      food_sugar_g: null,
      food_sodium_mg: null,
      food_barcode: null,
      food_is_custom: 0,
      food_created_at: 1000,
    }]);
    const result = getTemplateItems(db as never, 'tpl_001');
    expect(result).toHaveLength(1);
    expect(result[0].food.name).toBe('Chicken Breast');
    expect(result[0].servings).toBe(1.5);
  });
});
