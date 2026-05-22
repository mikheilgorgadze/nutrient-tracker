import type { FoodEstimate } from '@/lib/ai/schema';

/**
 * Mock factory for the food photo analysis module.
 * Import this in tests that trigger the camera/AI flow.
 *
 * Usage:
 *   jest.mock('@/lib/ai/analyze');
 *   import { analyzeFood } from '@/lib/ai/analyze';
 *   (analyzeFood as jest.Mock).mockResolvedValueOnce(makeFoodEstimate());
 */
export function makeFoodEstimate(overrides?: Partial<FoodEstimate>): FoodEstimate {
  return {
    name: 'Grilled Chicken Breast',
    serving_description: '1 medium breast',
    estimated_weight_g: 150,
    kcal: 248,
    protein_g: 46.5,
    carbs_g: 0,
    fat_g: 5.4,
    confidence: 'high',
    notes: null,
    ...overrides,
  };
}
