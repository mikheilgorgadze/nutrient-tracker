import { dailyTargets } from '@/lib/algorithms/targets';

describe('dailyTargets', () => {
  const tdee = 2000;
  const bodyWeightKg = 80;

  describe('calorie target', () => {
    it('sets kcal to TDEE for maintain', () => {
      const result = dailyTargets(tdee, { goalType: 'maintain', weeklyRateKg: 0 }, bodyWeightKg);
      expect(result.kcal).toBe(2000);
    });

    it('reduces kcal for lose', () => {
      // 0.5 kg/week * 7700 / 7 = 550 kcal/day deficit
      const result = dailyTargets(tdee, { goalType: 'lose', weeklyRateKg: 0.5 }, bodyWeightKg);
      expect(result.kcal).toBe(2000 - 550);
    });

    it('increases kcal for gain', () => {
      const result = dailyTargets(tdee, { goalType: 'gain', weeklyRateKg: 0.25 }, bodyWeightKg);
      // 0.25 * 7700 / 7 = 275 surplus
      expect(result.kcal).toBe(2000 + 275);
    });
  });

  describe('macro allocation', () => {
    it('protein is 2g per kg body weight', () => {
      const result = dailyTargets(tdee, { goalType: 'maintain', weeklyRateKg: 0 }, bodyWeightKg);
      expect(result.protein_g).toBe(160); // 2.0 * 80
    });

    it('fat is approximately 25% of kcal', () => {
      const result = dailyTargets(tdee, { goalType: 'maintain', weeklyRateKg: 0 }, bodyWeightKg);
      // 2000 * 0.25 / 9 = 55.6 → rounded to 56
      expect(result.fat_g).toBeCloseTo(56, 0);
    });

    it('carbs are never negative', () => {
      // Extreme cut + high protein/fat could make carbs negative if not floored
      const result = dailyTargets(
        1200,
        { goalType: 'lose', weeklyRateKg: 0.75 },
        100, // heavy person → protein_g = 200g = 800 kcal
      );
      expect(result.carbs_g).toBeGreaterThanOrEqual(0);
    });

    it('macro kcal sums close to calorie target', () => {
      const result = dailyTargets(tdee, { goalType: 'maintain', weeklyRateKg: 0 }, bodyWeightKg);
      const macroKcal = result.protein_g * 4 + result.carbs_g * 4 + result.fat_g * 9;
      // Allow small rounding difference
      expect(Math.abs(macroKcal - result.kcal)).toBeLessThanOrEqual(10);
    });

    it('all macro values are non-negative integers', () => {
      const result = dailyTargets(tdee, { goalType: 'lose', weeklyRateKg: 0.5 }, bodyWeightKg);
      expect(result.protein_g).toBeGreaterThanOrEqual(0);
      expect(result.carbs_g).toBeGreaterThanOrEqual(0);
      expect(result.fat_g).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.kcal)).toBe(true);
      expect(Number.isInteger(result.protein_g)).toBe(true);
      expect(Number.isInteger(result.carbs_g)).toBe(true);
      expect(Number.isInteger(result.fat_g)).toBe(true);
    });
  });
});
