import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore } from '@/store/diaryStore';
import { useDiary } from '../hooks/useDiary';
import { useDiaryMutations } from '../hooks/useDiaryMutations';
import { useWeightLog } from '@/features/progress/hooks/useWeightLog';
import { useWeightMutations } from '@/features/progress/hooks/useWeightMutations';
import { WeightEntrySheet } from '@/features/progress/components/WeightEntrySheet';
import { DiaryHeader } from '../components/DiaryHeader';
import { MealSection } from '../components/MealSection';
import { AddEntryFAB } from '../components/AddEntryFAB';
import { EditEntrySheet } from '../components/EditEntrySheet';
import { FoodSearchModal } from '@/features/foods/components/FoodSearchModal';
import { today } from '@/lib/db';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme/tokens';
import type { DiaryEntryWithFood } from '@/lib/db/types';

export function DiaryScreen() {
  const { activeDate, goToPrevDay, goToNextDay, goToToday, activeMealSlot, setActiveMealSlot } = useDiaryStore();
  const { data, isLoading, error } = useDiary(activeDate);
  const { addEntry, removeEntry, updateServings } = useDiaryMutations();
  const { data: weightData } = useWeightLog(3);
  const { logWeight } = useWeightMutations();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<DiaryEntryWithFood | null>(null);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);

  const showWeightNudge = activeDate === today() && !(weightData?.dates.includes(today()));

  function findEntry(id: string): DiaryEntryWithFood | undefined {
    return data?.sections.flatMap(s => s.entries).find(e => e.id === id);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load diary</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DiaryHeader
        date={activeDate}
        totals={data.totals}
        targets={data.targets}
        onPrevDay={goToPrevDay}
        onNextDay={goToNextDay}
        onGoToToday={goToToday}
        latestWeight={weightData?.rawWeights.at(-1)}
      />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {data.sections.map(section => (
          <MealSection
            key={section.slot}
            section={section}
            onDeleteEntry={id => removeEntry.mutate(id)}
            onPressEntry={id => {
              const entry = findEntry(id);
              if (entry) setEditEntry(entry);
            }}
            onAddToSlot={() => {
              setActiveMealSlot(section.slot);
              setAddSheetOpen(true);
            }}
          />
        ))}
        {showWeightNudge && (
          <TouchableOpacity
            style={styles.weightNudge}
            onPress={() => setWeightSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Log today's weight"
          >
            <Ionicons name="scale-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.weightNudgeText}>Log today's weight to improve TDEE accuracy</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddEntryFAB onPress={() => setAddSheetOpen(true)} />

      <FoodSearchModal
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        initialMealSlot={activeMealSlot}
      />

      <EditEntrySheet
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onUpdate={(entryId, servings, food, mealSlot) =>
          updateServings.mutate({ entryId, servings, food, mealSlot })
        }
        onDelete={id => removeEntry.mutate(id)}
        onCopyToToday={activeDate !== today() ? (food, servings, mealSlot) => {
          addEntry.mutate({ food, servings, date: today(), mealSlot });
        } : undefined}
      />

      <WeightEntrySheet
        visible={weightSheetOpen}
        onClose={() => setWeightSheetOpen(false)}
        onSave={(date, weight_kg) => logWeight.mutate({ date, weight_kg })}
        initialWeight={weightData?.rawWeights.at(-1) ?? 70}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.base,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 1,
  },
  weightNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  weightNudgeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
