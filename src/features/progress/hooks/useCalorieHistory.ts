import { useQuery } from '@tanstack/react-query';
import { useDb } from '@/hooks/useDb';
import { getDiaryKcalByDate } from '@/lib/db/queries/progress';

export interface CalorieHistoryEntry {
  date: string;   // YYYY-MM-DD
  kcal: number;
}

/**
 * Returns the last `days` days of calorie data, ordered oldest first.
 * Dates with no diary entries are filled in with kcal=0 so the result
 * always contains exactly `days` entries.
 */
export function useCalorieHistory(days = 7): {
  data: CalorieHistoryEntry[];
  isLoading: boolean;
} {
  const db = useDb();

  const query = useQuery<CalorieHistoryEntry[]>({
    queryKey: ['progress', 'calorieHistory', days],
    enabled: db !== null,
    queryFn: () => {
      const rows = getDiaryKcalByDate(db!, days);

      // Build a map of date → kcal from DB results
      const byDate = new Map<string, number>();
      for (const row of rows) {
        byDate.set(row.date, row.kcal);
      }

      // Generate the full date range (oldest → today), filling gaps with 0
      const result: CalorieHistoryEntry[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        result.push({ date: dateStr, kcal: byDate.get(dateStr) ?? 0 });
      }

      return result;
    },
    staleTime: 0,
  });

  return { data: query.data ?? [], isLoading: query.isLoading };
}

/**
 * Computes the average kcal, excluding days with 0 kcal.
 * If all days are 0, returns 0.
 */
export function avgKcalExcludingZero(entries: CalorieHistoryEntry[]): number {
  const logged = entries.filter(e => e.kcal > 0);
  if (logged.length === 0) return 0;
  const sum = logged.reduce((acc, e) => acc + e.kcal, 0);
  return Math.round(sum / logged.length);
}
