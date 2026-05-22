import { mifflinBMR, baselineTDEE, adaptiveTDEE, ACTIVITY_MULTIPLIERS } from '@/lib/algorithms/tdee';
import type { WeeklyDataPoint } from '@/lib/algorithms/tdee';

describe('mifflinBMR', () => {
  it('calculates correctly for a reference male', () => {
    // 80kg, 180cm, 30yo male → 10*80 + 6.25*180 - 5*30 + 5 = 800+1125-150+5 = 1780
    expect(mifflinBMR({ sex: 'male', age: 30, height_cm: 180, weight_kg: 80 })).toBe(1780);
  });

  it('calculates correctly for a reference female', () => {
    // 60kg, 165cm, 28yo female → 10*60 + 6.25*165 - 5*28 - 161 = 600+1031.25-140-161 = 1330.25
    expect(mifflinBMR({ sex: 'female', age: 28, height_cm: 165, weight_kg: 60 })).toBeCloseTo(1330.25);
  });

  it('returns higher BMR for male vs female with same stats', () => {
    const params = { age: 30, height_cm: 175, weight_kg: 75 };
    expect(mifflinBMR({ sex: 'male', ...params })).toBeGreaterThan(
      mifflinBMR({ sex: 'female', ...params }),
    );
  });

  it('increases BMR with higher weight', () => {
    const base = { sex: 'male' as const, age: 30, height_cm: 175 };
    expect(mifflinBMR({ ...base, weight_kg: 90 })).toBeGreaterThan(
      mifflinBMR({ ...base, weight_kg: 70 }),
    );
  });

  it('decreases BMR with higher age', () => {
    const base = { sex: 'female' as const, height_cm: 165, weight_kg: 65 };
    expect(mifflinBMR({ ...base, age: 50 })).toBeLessThan(
      mifflinBMR({ ...base, age: 25 }),
    );
  });
});

describe('baselineTDEE', () => {
  it('multiplies BMR by the correct activity multiplier', () => {
    expect(baselineTDEE(1500, 'sedentary')).toBeCloseTo(1500 * 1.2);
    expect(baselineTDEE(1500, 'moderate')).toBeCloseTo(1500 * 1.55);
    expect(baselineTDEE(1500, 'very_active')).toBeCloseTo(1500 * 1.9);
  });

  it('returns higher TDEE for more active levels', () => {
    const bmr = 1600;
    expect(baselineTDEE(bmr, 'active')).toBeGreaterThan(baselineTDEE(bmr, 'light'));
    expect(baselineTDEE(bmr, 'very_active')).toBeGreaterThan(baselineTDEE(bmr, 'active'));
  });

  it('covers all 5 activity levels', () => {
    const levels = Object.keys(ACTIVITY_MULTIPLIERS);
    expect(levels).toHaveLength(5);
  });
});

describe('adaptiveTDEE', () => {
  const baseline = 2000;

  it('returns baseline with 0 confidence when no data points', () => {
    const result = adaptiveTDEE([], baseline);
    expect(result.tdee).toBe(baseline);
    expect(result.confidence).toBe(0);
  });

  it('returns baseline with 0 confidence when only 1 data point', () => {
    const result = adaptiveTDEE(
      [{ weekStart: '2026-01-05', avgKcal: 2000, avgWeight: 80 }],
      baseline,
    );
    expect(result.tdee).toBe(baseline);
    expect(result.confidence).toBe(0);
  });

  it('confidence increases with more data points', () => {
    const makePoints = (n: number): WeeklyDataPoint[] =>
      Array.from({ length: n }, (_, i) => ({
        weekStart: `2026-0${Math.floor(i / 4) + 1}-${String((i % 4) * 7 + 1).padStart(2, '0')}`,
        avgKcal: 2000,
        avgWeight: 80,
      }));

    const r2  = adaptiveTDEE(makePoints(2),  baseline);
    const r5  = adaptiveTDEE(makePoints(5),  baseline);
    const r9  = adaptiveTDEE(makePoints(9),  baseline);

    expect(r5.confidence).toBeGreaterThan(r2.confidence);
    expect(r9.confidence).toBeGreaterThan(r5.confidence);
    expect(r9.confidence).toBe(1); // saturates at 8 pairs (9 points)
  });

  it('estimates TDEE close to 2000 when weight is stable and 2000 kcal logged', () => {
    const stablePoints: WeeklyDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      weekStart: `2026-0${Math.floor(i / 4) + 1}-${String((i % 4) * 7 + 1).padStart(2, '0')}`,
      avgKcal: 2000,
      avgWeight: 80, // no change
    }));
    const result = adaptiveTDEE(stablePoints, baseline);
    // stable weight means implied TDEE = calories logged = 2000
    expect(result.tdee).toBeCloseTo(2000, 0);
  });

  it('adjusts TDEE upward when weight is dropping despite eating 2000 kcal', () => {
    // If weight drops, TDEE must be higher than calories logged
    const droppingWeightPoints: WeeklyDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      weekStart: `2026-0${Math.floor(i / 4) + 1}-${String((i % 4) * 7 + 1).padStart(2, '0')}`,
      avgKcal: 2000,
      avgWeight: 80 - i * 0.3, // steadily losing weight
    }));
    const result = adaptiveTDEE(droppingWeightPoints, baseline);
    expect(result.tdee).toBeGreaterThan(2000);
  });

  it('returns a rounded integer for tdee', () => {
    const pts: WeeklyDataPoint[] = [
      { weekStart: '2026-01-05', avgKcal: 2100, avgWeight: 80.0 },
      { weekStart: '2026-01-12', avgKcal: 2100, avgWeight: 80.1 },
    ];
    const result = adaptiveTDEE(pts, baseline);
    expect(Number.isInteger(result.tdee)).toBe(true);
  });
});
