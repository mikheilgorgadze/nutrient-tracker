import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { FoodSearchModal } from '@/features/foods/components/FoodSearchModal';
import { EditFoodModal } from '@/features/foods/components/EditFoodModal';
import { useCustomFoods } from '@/features/foods/hooks/useCustomFoods';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow } from '@/lib/db/types';

export default function FoodsTab() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = useState(false);
  const [editFood, setEditFood] = useState<FoodRow | null>(null);
  const { data: customFoods } = useCustomFoods();

  const hasCustomFoods = (customFoods?.length ?? 0) > 0;

  return (
    <FeatureErrorBoundary fallbackTitle="Could not load foods">
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Foods</Text>

      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => setSearchOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Search foods"
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={17} color={colors.textTertiary} />
        <Text style={styles.searchPlaceholder}>Search foods…</Text>
      </TouchableOpacity>

      {hasCustomFoods ? (
        <View style={styles.myFoodsSection}>
          <Text style={styles.sectionTitle}>My Foods</Text>
          <FlatList
            data={customFoods}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.customFoodRow}>
                <View style={styles.customFoodInfo}>
                  <Text style={styles.customFoodName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.customFoodMeta}>
                    {item.serving_label} · {item.kcal_per_serving} kcal
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditFood(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={17} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Search to add foods to your diary</Text>
          <Text style={styles.emptySubtext}>
            Tap + in the search bar to create a custom food
          </Text>
        </View>
      )}

      <FoodSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <EditFoodModal
        food={editFood}
        onClose={() => setEditFood(null)}
      />
    </View>
    </FeatureErrorBoundary>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    color: colors.textTertiary,
    fontSize: fontSize.base,
  },
  myFoodsSection: {
    flex: 1,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  customFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  customFoodInfo: {
    flex: 1,
    gap: 2,
  },
  customFoodName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  customFoodMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  editBtn: {
    padding: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: fontSize.base,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
