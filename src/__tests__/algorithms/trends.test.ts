import { ewma, weeklyRateOfChange, toWeeklyAverages } from '@/lib/algorithms/trends';

describe('ewma', () => {
  it('returns empty array for empty input', () => {
    expect(ewma([])).toEqual([]);
  });

  it('returns single-element array for single input', () => {
    expect(ewma([75])).toEqual([75]);
  });

  it('first smoothed value equals first raw value', () => {
    const result = ewma([80, 79, 81, 78]);
    expect(result[0]).toBe(80);
  });

  it('output length matches input length', () => {
    const weights = [80, 79.5, 80.2, 79.8, 79.3];
    expect(ewma(weights)).toHaveLength(weights.length);
  });

  it('smoothed series is less volatile than raw series', () => {
    const noisy = [80, 82, 78, 83, 77, 81, 79];
    const smoothed = ewma(noisy, 0.1);
    const rawVariance = variance(noisy);
    const smoothedVariance = variance(smoothed);
    expect(smoothedVariance).toBeLessThan(rawVariance);
  });

  it('converges toward a stable value over time with constant input', () => {
    // All inputs = 75; smoothed should approach 75
    const constant = Array(50).fill(75);
    constant[0] = 80; // start at 80
    const smoothed = ewma(constant, 0.1);
    expect(smoothed[smoothed.length - 1]).toBeCloseTo(75, 0);
  });
});

describe('weeklyRateOfChange', () => {
  it('returns 0 for empty input', () => {
    expect(weeklyRateOfChange([], 28)).toBe(0);
  });

  it('returns 0 for single data point', () => {
    expect(weeklyRateOfChange([80], 28)).toBe(0);
  });

  it('returns 0 for a flat (no change) series', () => {
    const flat = Array(30).fill(80);
    expect(weeklyRateOfChange(flat, 28)).toBeCloseTo(0, 5);
  });

  it('returns positive rate for steadily increasing weights', () => {
    // Increasing by 0.1 kg/day → 0.7 kg/week
    const increasing = Array.from({ length: 30 }, (_, i) => 75 + i * 0.1);
    const rate = weeklyRateOfChange(increasing, 28);
    expect(rate).toBeCloseTo(0.7, 1);
  });

  it('returns negative rate for steadily decreasing weights', () => {
    const decreasing = Array.from({ length: 30 }, (_, i) => 85 - i * 0.07);
    const rate = weeklyRateOfChange(decreasing, 28);
    expect(rate).toBeLessThan(0);
  });

  it('uses only the last windowDays values', () => {
    // First 10 values going up, last 20 flat — with window=20 should be near 0
    const mixed = [
      ...Array.from({ length: 10 }, (_, i) => 70 + i),
      ...Array(20).fill(80),
    ];
    const rate = weeklyRateOfChange(mixed, 20);
    expect(Math.abs(rate)).toBeLessThan(0.1);
  });
});

describe('toWeeklyAverages', () => {
  it('returns empty array with no data', () => {
    expect(toWeeklyAverages([], [])).toEqual([]);
  });

  it('returns empty array when no dates overlap', () => {
    const kcal = [{ date: '2026-01-05', kcal: 2000 }];
    const weight = [{ date: '2026-01-06', weight_kg: 80 }];
    expect(toWeeklyAverages(kcal, weight)).toEqual([]);
  });

  it('excludes weeks with fewer than 4 paired days', () => {
    // Only 3 days of paired data in the week
    const dates = ['2026-01-05', '2026-01-06', '2026-01-07']; // Mon/Tue/Wed only
    const kcal   = dates.map(date => ({ date, kcal: 2000 }));
    const weight = dates.map(date => ({ date, weight_kg: 80 }));
    expect(toWeeklyAverages(kcal, weight)).toHaveLength(0);
  });

  it('includes weeks with 4+ paired days', () => {
    const dates = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08']; // 4 days
    const kcal   = dates.map(date => ({ date, kcal: 2000 }));
    const weight = dates.map(date => ({ date, weight_kg: 80 }));
    const result = toWeeklyAverages(kcal, weight);
    expect(result).toHaveLength(1);
    expect(result[0].weekStart).toBe('2026-01-05');
    expect(result[0].avgKcal).toBe(2000);
    expect(result[0].avgWeight).toBe(80);
  });

  it('correctly averages values within a week', () => {
    const dates = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'];
    const kcal   = dates.map((date, i) => ({ date, kcal: 1800 + i * 100 })); // 1800,1900,2000,2100 → avg 1950
    const weight = dates.map((date, i) => ({ date, weight_kg: 79.5 + i * 0.1 })); // avg 79.65
    const result = toWeeklyAverages(kcal, weight);
    expect(result[0].avgKcal).toBeCloseTo(1950, 1);
    expect(result[0].avgWeight).toBeCloseTo(79.65, 2);
  });

  it('separates data into correct ISO weeks', () => {
    // Two full weeks
    const week1 = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'];
    const week2 = ['2026-01-12', '2026-01-13', '2026-01-14', '2026-01-15'];
    const dates = [...week1, ...week2];
    const kcal   = dates.map(date => ({ date, kcal: 2000 }));
    const weight = dates.map(date => ({ date, weight_kg: 80 }));
    const result = toWeeklyAverages(kcal, weight);
    expect(result).toHaveLength(2);
    expect(result[0].weekStart).toBe('2026-01-05');
    expect(result[1].weekStart).toBe('2026-01-12');
  });

  it('returns weeks sorted by date ascending', () => {
    const week1 = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'];
    const week2 = ['2026-01-12', '2026-01-13', '2026-01-14', '2026-01-15'];
    const dates = [...week2, ...week1]; // reversed order
    const kcal   = dates.map(date => ({ date, kcal: 2000 }));
    const weight = dates.map(date => ({ date, weight_kg: 80 }));
    const result = toWeeklyAverages(kcal, weight);
    expect(result[0].weekStart < result[1].weekStart).toBe(true);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function variance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}
