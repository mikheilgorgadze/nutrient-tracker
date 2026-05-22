import type { ActivityLevel } from '@/lib/db/types';

// ─── BMR ────────────────────────────────────────────────────────────────────

export interface BMRParams {
  sex: 'male' | 'female';
  age: number;       // years
  height_cm: number;
  weight_kg: number;
}

/**
 * Mifflin-St Jeor BMR formula.
 * Returns kcal/day.
 */
export function mifflinBMR(params: BMRParams): number {
  const { sex, age, height_cm, weight_kg } = params;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

// ─── Baseline TDEE ──────────────────────────────────────────────────────────

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

/**
 * Baseline TDEE = BMR × activity multiplier.
 */
export function baselineTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity];
}

// ─── Adaptive TDEE ──────────────────────────────────────────────────────────

export interface WeeklyDataPoint {
  weekStart: string;    // ISO date 'YYYY-MM-DD' (Monday)
  avgKcal: number;      // average kcal logged that week
  avgWeight: number;    // average scale weight (kg) that week
}

export interface TDEEEstimate {
  tdee: number;
  confidence: number;   // 0–1
}

/** kcal equivalent of 1 kg body mass change */
const KCAL_PER_KG = 7700;

/** Exponential decay half-life in weeks — recent data weighted more */
const HALF_LIFE_WEEKS = 3;
const LAMBDA = Math.LN2 / HALF_LIFE_WEEKS;

/**
 * MacroFactor-style adaptive TDEE estimation using weighted least-squares.
 *
 * Principle: if calories_in > TDEE → weight rises; if < TDEE → weight falls.
 * We use the observed weight change vs logged calories to back-calculate TDEE.
 *
 * Recent weeks are weighted more heavily (exponential decay, half-life 3 weeks).
 * Confidence grows with data: saturates at 1.0 after 8+ usable weeks.
 * Result blends with baseline until confidence is high.
 */
export function adaptiveTDEE(
  dataPoints: WeeklyDataPoint[],
  baseline: number,
): TDEEEstimate {
  const n = dataPoints.length;

  if (n < 2) {
    return { tdee: Math.round(baseline), confidence: 0 };
  }

  // For each consecutive pair compute:
  //   implied_tdee = avg_kcal - (weight_change * KCAL_PER_KG)
  // Then take a weighted average of those implied TDEEs.
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 1; i < n; i++) {
    const weightChange = dataPoints[i].avgWeight - dataPoints[i - 1].avgWeight;
    const impliedTDEE = dataPoints[i].avgKcal - weightChange * KCAL_PER_KG;

    // Newer pairs get higher weight (age = 0 means most recent pair)
    const age = n - 1 - i;
    const w = Math.exp(-LAMBDA * age);

    weightedSum  += w * impliedTDEE;
    totalWeight  += w;
  }

  const regressionTDEE = weightedSum / totalWeight;

  // Confidence: 0 at n=1 (no pairs), saturates toward 1 at n=9 (8 pairs)
  const confidence = Math.min(1, (n - 1) / 8);

  const tdee = confidence * regressionTDEE + (1 - confidence) * baseline;

  return { tdee: Math.round(tdee), confidence };
}
