import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { SearchResultItem } from './SearchResultItem';
import { FoodDetailSheet } from './FoodDetailSheet';
import { CreateFoodModal } from './CreateFoodModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { useDiaryMutations } from '@/features/diary/hooks/useDiaryMutations';
import { useDiaryStore } from '@/store/diaryStore';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';
import type { FoodRow, MealSlot } from '@/lib/db/types';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-selected meal slot — can be changed inside the modal */
  initialMealSlot?: MealSlot;
}

export function FoodSearchModal({ visible, onClose, initialMealSlot }: FoodSearchModalProps) {
  const [term, setTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { results, isLoading } = useFoodSearch(term);
  const { addEntry } = useDiaryMutations();
  const { activeMealSlot, activeDate } = useDiaryStore();
  const mealSlot: MealSlot = initialMealSlot ?? activeMealSlot;

  function handleClose() {
    setTerm('');
    setSelectedFood(null);
    onClose();
  }

  function handleAdd(food: FoodRow, servings: number, slot: MealSlot) {
    addEntry.mutate({ food, servings, date: activeDate, mealSlot: slot });
  }

  function handleSelectFood(food: FoodRow) {
    Keyboard.dismiss();
    setSelectedFood(food);
  }

  function handleFoodCreated(food: Omit<FoodRow, 'created_at'>) {
    setSelectedFood(food as FoodRow);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              value={term}
              onChangeText={setTerm}
              placeholder="Search foods…"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
              selectionColor={colors.accent}
              accessibilityLabel="Search foods"
              accessibilityRole="search"
            />
          </View>
          <TouchableOpacity
            onPress={() => setScannerOpen(true)}
            style={styles.createBtn}
            accessibilityRole="button"
            accessibilityLabel="Scan barcode"
          >
            <Ionicons name="barcode-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCreateOpen(true)}
            style={styles.createBtn}
            accessibilityRole="button"
            accessibilityLabel="Create custom food"
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.cancelBtn}
            accessibilityRole="button"
            accessibilityLabel="Cancel search"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {isLoading && term.length >= 2 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : results.length === 0 && term.length >= 2 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No results for "{term}"</Text>
            <TouchableOpacity
              style={styles.createFoodBtn}
              onPress={() => setCreateOpen(true)}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
              <Text style={styles.createFoodBtnText}>Create "{term}"</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <SearchResultItem food={item} onPress={handleSelectFood} />
            )}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
        )}

      {/* Overlay within the same Modal — avoids nested Modal touch issues */}
      <FoodDetailSheet
        food={selectedFood}
        mealSlot={mealSlot}
        onClose={() => setSelectedFood(null)}
        onAdd={handleAdd}
      />
      </View>

      <CreateFoodModal
        visible={createOpen}
        initialName={term}
        onClose={() => setCreateOpen(false)}
        onCreated={handleFoodCreated}
      />

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onFound={food => { setScannerOpen(false); setSelectedFood(food); }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    paddingVertical: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  createBtn: {
    padding: spacing.xs,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  createFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  createFoodBtnText: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
