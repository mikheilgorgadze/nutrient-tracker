import { create } from 'zustand';
import { today } from '@/lib/db';
import type { MealSlot } from '@/lib/db/types';

interface DiaryStore {
  activeDate: string;
  activeMealSlot: MealSlot;
  setActiveDate: (date: string) => void;
  setActiveMealSlot: (slot: MealSlot) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
}

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  activeDate: today(),
  activeMealSlot: 'lunch',
  setActiveDate: (date) => set({ activeDate: date }),
  setActiveMealSlot: (slot) => set({ activeMealSlot: slot }),
  goToPrevDay: () => set({ activeDate: offsetDate(get().activeDate, -1) }),
  goToNextDay: () => {
    const next = offsetDate(get().activeDate, +1);
    if (next <= today()) set({ activeDate: next });
  },
  goToToday: () => set({ activeDate: today() }),
}));
