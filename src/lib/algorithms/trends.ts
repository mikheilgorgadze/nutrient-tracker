import type { WeeklyDataPoint } from './tdee';

/** Minimum logged days in a week for it to count in TDEE regression */
const MIN_DAYS_PER_WEEK = 4;

// ─── EWMA ────────────────────────────────────────────────────────────────────

/**
 * Exponentially weighted moving average for smoothing noisy daily weights.
 *
 * alpha = 0.1 → slow, smooth trend (MacroFactor default).
 * Lower alpha = smoother but lags more; higher = reacts faster but noisier.
 *
 * Returns one smoothed value per input value.
 * Empty input returns empty output.
 */
export function ewma(weights: number[], alpha = 0.1): number[] {
  if (weights.length === 0) return [];
  const result: number[] = [weights[0]];
  for (let i = 1; i < weights.length; i++) {
    result.push(alpha * weights[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

// ─── Rate of change ──────────────────────────────────────────────────────────

/**
 * Estimates kg/week rate of weight change from smoothed weights.
 * Uses ordinary least-squares slope on a trailing window of smoothed values.
 *
 * Returns 0 if fewer than 2 data points in window.
 */
export function weeklyRateOfChange(
  smoothed: number[],
  windowDays = 28,
): number {
  const n = Math.min(smoothed.length, windowDays);
  if (n < 2) return 0;

  const slice = smoothed.slice(-n);
  const xMean = (n - 1) / 2;
  const yMean = slice.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (slice[i] - yMean);
    den += (i - xMean) ** 2;
  }

  const slopePerDay = den === 0 ? 0 : num / den;
  return slopePerDay * 7; // convert daily slope → kg/week
}

// ─── Weekly averaging ────────────────────────────────────────────────────────

interface DailyKcal   { date: string; kcal: number }
interface DailyWeight { date: string; weight_kg: number }

/**
 * Groups daily calorie and weight data into ISO weeks (Mon–Sun) and
 * returns weekly averages suitable for adaptiveTDEE().
 *
 * Weeks with fewer than MIN_DAYS_PER_WEEK of logged data are excluded
 * (too sparse to produce a reliable TDEE estimate).
 */
export function toWeeklyAverages(
  dailyKcal: DailyKcal[],
  dailyWeight: DailyWeight[],
): WeeklyDataPoint[] {
  // Build lookup maps keyed by ISO date string
  const kcalMap = new Map(dailyKcal.map(d => [d.date, d.kcal]));
  const weightMap = new Map(dailyWeight.map(d => [d.date, d.weight_kg]));

  // Collect all dates that have both kcal and weight data
  const pairedDates: string[] = [];
  for (const date of kcalMap.keys()) {
    if (weightMap.has(date)) pairedDates.push(date);
  }
  pairedDates.sort();

  // Group by ISO week (Monday = week start)
  const weekMap = new Map<string, { kcals: number[]; weights: number[] }>();

  for (const date of pairedDates) {
    const weekStart = getMonday(date);
    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, { kcals: [], weights: [] });
    }
    const entry = weekMap.get(weekStart)!;
    entry.kcals.push(kcalMap.get(date)!);
    entry.weights.push(weightMap.get(date)!);
  }

  // Build result, filtering sparse weeks
  const result: WeeklyDataPoint[] = [];
  for (const [weekStart, { kcals, weights }] of weekMap) {
    if (kcals.length < MIN_DAYS_PER_WEEK) continue;
    result.push({
      weekStart,
      avgKcal:   kcals.reduce((a, b) => a + b, 0) / kcals.length,
      avgWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
    });
  }

  result.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the ISO date string of the Monday of the week containing `date`. */
function getMonday(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, …
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
