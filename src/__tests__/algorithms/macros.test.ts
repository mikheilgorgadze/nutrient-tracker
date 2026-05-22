import { macrosForServings, sumMacros } from '@/lib/algorithms/macros';
import type { MacroTotals } from '@/lib/db/types';

const chickenBreast = {
  kcal_per_serving: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
};

describe('macrosForServings', () => {
  it('returns exact macros for 1 serving', () => {
    const result = macrosForServings(chickenBreast, 1);
    expect(result.kcal).toBe(165);
    expect(result.protein_g).toBe(31);
    expect(result.carbs_g).toBe(0);
    expect(result.fat_g).toBe(3.6);
  });

  it('scales linearly for 2 servings', () => {
    const result = macrosForServings(chickenBreast, 2);
    expect(result.kcal).toBe(330);
    expect(result.protein_g).toBe(62);
  });

  it('handles fractional servings', () => {
    const result = macrosForServings(chickenBreast, 1.5);
    expect(result.kcal).toBeCloseTo(247.5, 1);
    expect(result.protein_g).toBeCloseTo(46.5, 1);
  });

  it('returns zeros for 0 servings', () => {
    const result = macrosForServings(chickenBreast, 0);
    expect(result.kcal).toBe(0);
    expect(result.protein_g).toBe(0);
  });
});

describe('sumMacros', () => {
  it('returns zeros for empty array', () => {
    const result = sumMacros([]);
    expect(result).toEqual({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  });

  it('returns single entry unchanged', () => {
    const entry: MacroTotals = { kcal: 100, protein_g: 10, carbs_g: 20, fat_g: 5 };
    expect(sumMacros([entry])).toEqual(entry);
  });

  it('sums multiple entries correctly', () => {
    const entries: MacroTotals[] = [
      { kcal: 165, protein_g: 31, carbs_g: 0,  fat_g: 3.6 },
      { kcal: 130, protein_g: 2.7, carbs_g: 28.2, fat_g: 0.3 },
      { kcal: 57,  protein_g: 0.7, carbs_g: 14.5, fat_g: 0.3 },
    ];
    const result = sumMacros(entries);
    expect(result.kcal).toBeCloseTo(352, 0);
    expect(result.protein_g).toBeCloseTo(34.4, 1);
    expect(result.carbs_g).toBeCloseTo(42.7, 1);
    expect(result.fat_g).toBeCloseTo(4.2, 1);
  });
});
