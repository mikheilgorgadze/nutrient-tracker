import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDb } from '@/hooks/useDb';
import { initBundledFoods } from '@/lib/db';
import { getLatestTdeeEstimate, getDiaryKcalByDate, getWeightLog, insertTdeeHistory } from '@/lib/db/queries/progress';
import { getGoals } from '@/lib/db/queries/goals';
import { mifflinBMR, baselineTDEE, adaptiveTDEE } from '@/lib/algorithms/tdee';
import { toWeeklyAverages } from '@/lib/algorithms/trends';
import { newId } from '@/lib/db';
import { useColors } from '@/hooks/useColors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

/** Silently recalculates TDEE if last estimate is > 7 days old or absent. */
function TdeeRecalculator() {
  const db = useDb();

  const recalc = useMutation({
    mutationFn: () => {
      if (!db) return Promise.resolve();
      const latest = getLatestTdeeEstimate(db);
      const goals = getGoals(db);
      if (!goals) return Promise.resolve();

      // Check staleness
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
      if (latest && latest.week_start >= cutoff) return Promise.resolve();

      // Gather data for regression
      const kcalByDate = getDiaryKcalByDate(db, 90);
      const weightLog = getWeightLog(db, 90);
      const weeklyPoints = toWeeklyAverages(kcalByDate, weightLog);

      const bmr = mifflinBMR({
        sex: goals.sex,
        age: goals.age_years,
        height_cm: goals.height_cm,
        weight_kg: goals.weight_kg,
      });
      const baseline = baselineTDEE(bmr, goals.activity_level);
      const { tdee, confidence } = adaptiveTDEE(weeklyPoints, baseline);

      // Get the most recent Monday as week_start
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      now.setDate(now.getDate() + diff);
      const weekStart = now.toISOString().slice(0, 10);

      insertTdeeHistory(db, {
        id: newId(),
        week_start: weekStart,
        estimated_tdee: tdee,
        confidence,
        data_points: weeklyPoints.length,
      });

      queryClient.invalidateQueries({ queryKey: ['progress', 'tdee'] });
      return Promise.resolve();
    },
  });

  useEffect(() => {
    if (db) {
      initBundledFoods(); // async, fire-and-forget
      recalc.mutate();
    }
  }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function ThemedLayout() {
  const colors = useColors();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.background === '#FFFFFF' ? 'dark' : 'light'} />
      <TdeeRecalculator />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedLayout />
      </QueryClientProvider>
  );
}
