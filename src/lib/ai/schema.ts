// Placeholder — full implementation in Phase 7
// Defined here so test mocks can import the type in Phase 0.

export interface FoodEstimate {
  name: string;
  serving_description: string;
  estimated_weight_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'low' | 'medium' | 'high';
  notes: string | null;
}
