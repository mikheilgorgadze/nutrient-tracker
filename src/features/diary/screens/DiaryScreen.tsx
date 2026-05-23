import React, { useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { useDiaryStore } from '@/store/diaryStore';
import { useDiary } from '../hooks/useDiary';
import { useDiaryMutations } from '../hooks/useDiaryMutations';
import { useTemplateMutations } from '../hooks/useTemplates';
import { useWeightLog } from '@/features/progress/hooks/useWeightLog';
import { useWeightMutations } from '@/features/progress/hooks/useWeightMutations';
import { WeightEntrySheet } from '@/features/progress/components/WeightEntrySheet';
import { DiaryHeader } from '../components/DiaryHeader';
import { MealSection } from '../components/MealSection';
import { AddEntryFAB } from '../components/AddEntryFAB';
import { EditEntrySheet } from '../components/EditEntrySheet';
import { TemplatesSheet } from '../components/TemplatesSheet';
import { ShareModal } from '../components/ShareModal';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { FoodSearchModal } from '@/features/foods/components/FoodSearchModal';
import { today } from '@/lib/db';
import { useColors } from '@/hooks/useColors';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/theme/tokens';
import type { DiaryEntryWithFood, MealSlot } from '@/lib/db/types';

export function DiaryScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { activeDate, goToPrevDay, goToNextDay, goToToday, activeMealSlot, setActiveMealSlot } = useDiaryStore();
  const { data, isLoading, error, refetch, isRefetching } = useDiary(activeDate);
  const { addEntry, removeEntry, updateServings } = useDiaryMutations();
  const { saveTemplate } = useTemplateMutations();
  const { data: weightData } = useWeightLog(3);
  const { logWeight } = useWeightMutations();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<DiaryEntryWithFood | null>(null);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const summaryCardRef = useRef<View>(null);

  async function captureCard(): Promise<string> {
    return captureRef(summaryCardRef, { format: 'png', quality: 1 });
  }

  const showWeightNudge = activeDate === today() && !(weightData?.dates.includes(today()));

  function findEntry(id: string): DiaryEntryWithFood | undefined {
    return data?.sections.flatMap(s => s.entries).find(e => e.id === id);
  }

  function handleSaveTemplate(slot: MealSlot, name: string) {
    const section = data?.sections.find(s => s.slot === slot);
    if (!section || section.entries.length === 0) return;
    const items = section.entries.map(e => ({ food_id: e.food_id, servings: e.servings }));
    saveTemplate.mutate({ name, items });
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

      {/* Toolbar row: Templates + Share */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setTemplatesOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Meal templates"
        >
          <Ionicons name="bookmark-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.toolbarBtnText}>Templates</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setShareOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Share daily summary"
        >
          <Ionicons name="share-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.toolbarBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Off-screen card — captured before modal opens, never visible to user */}
      <View style={styles.offScreen} pointerEvents="none">
        <DailySummaryCard
          ref={summaryCardRef}
          date={activeDate}
          totals={data.totals}
          targets={data.targets}
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        {data.sections.every(s => s.entries.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first meal</Text>
          </View>
        )}
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
            onSaveTemplate={name => handleSaveTemplate(section.slot, name)}
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

      <TemplatesSheet
        visible={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        activeMealSlot={activeMealSlot}
        activeDate={activeDate}
      />

      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        date={activeDate}
        totals={data.totals}
        targets={data.targets}
        onCapture={captureCard}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toolbarBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  offScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    zIndex: -1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  emptySubtitle: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
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
