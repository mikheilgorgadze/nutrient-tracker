import { useState, useCallback } from 'react';
import { useDb } from '@/hooks/useDb';
import { getFoodByBarcode, insertFood } from '@/lib/db/queries/foods';
import { newId } from '@/lib/db';
import type { FoodRow } from '@/lib/db/types';

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; food: FoodRow }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

interface OFFProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    'energy-kcal_serving'?: number;
    'energy-kcal_100g'?: number;
    proteins_serving?: number;
    proteins_100g?: number;
    carbohydrates_serving?: number;
    carbohydrates_100g?: number;
    fat_serving?: number;
    fat_100g?: number;
    fiber_serving?: number;
    fiber_100g?: number;
    sugars_serving?: number;
    sugars_100g?: number;
    sodium_serving?: number;
    sodium_100g?: number;
  };
}

function parseServingG(raw: string | undefined): number {
  if (!raw) return 100;
  const match = raw.match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? parseFloat(match[1]) : 100;
}

function offToFoodRow(barcode: string, p: OFFProduct): Omit<FoodRow, 'created_at'> {
  const n = p.nutriments ?? {};
  const serving_size_g = parseServingG(p.serving_size);
  const perServing = (perS: number | undefined, per100: number | undefined) => {
    if (perS != null) return Math.round(perS * 10) / 10;
    if (per100 != null) return Math.round((per100 * serving_size_g / 100) * 10) / 10;
    return 0;
  };

  return {
    id: `off_${barcode}`,
    name: (p.product_name ?? 'Unknown product').trim(),
    brand: p.brands?.split(',')[0]?.trim() ?? null,
    serving_size_g,
    serving_label: p.serving_size ?? `${serving_size_g}g`,
    kcal_per_serving: perServing(n['energy-kcal_serving'], n['energy-kcal_100g']),
    protein_g:        perServing(n.proteins_serving,        n.proteins_100g),
    carbs_g:          perServing(n.carbohydrates_serving,   n.carbohydrates_100g),
    fat_g:            perServing(n.fat_serving,             n.fat_100g),
    fiber_g:          n.fiber_serving != null ? Math.round(n.fiber_serving * 10) / 10 : null,
    sugar_g:          n.sugars_serving != null ? Math.round(n.sugars_serving * 10) / 10 : null,
    sodium_mg:        n.sodium_serving != null ? Math.round(n.sodium_serving * 1000 * 10) / 10 : null,
    barcode,
    is_custom: 0,
  };
}

export function useBarcodeLookup() {
  const db = useDb();
  const [state, setState] = useState<LookupState>({ status: 'idle' });

  const lookup = useCallback(async (barcode: string) => {
    if (!db) return;
    setState({ status: 'loading' });

    // 1. Check local DB first (covers bundled USDA/OFF foods and past lookups)
    const local = getFoodByBarcode(db, barcode);
    if (local) { setState({ status: 'found', food: local }); return; }

    // 2. Open Food Facts API
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,serving_size,nutriments`,
        { headers: { 'User-Agent': 'NutrientTracker/1.0' } },
      );
      const json = await res.json();
      if (json.status !== 1 || !json.product?.product_name) {
        setState({ status: 'not_found' });
        return;
      }
      const food = offToFoodRow(barcode, json.product as OFFProduct);
      // Cache in local DB so next scan is instant
      insertFood(db, food);
      setState({ status: 'found', food: { ...food, created_at: Date.now() } });
    } catch {
      setState({ status: 'error', message: 'Network error — check your connection' });
    }
  }, [db]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, lookup, reset };
}
