export interface LabelEstimate {
  name: string;
  brand: string | null;
  serving_label: string;
  serving_size_g: number;
  kcal_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

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
