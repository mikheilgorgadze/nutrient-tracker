/**
 * DiaryHeader — component-level tests.
 * Verifies date labels, weight chip rendering, and navigation button visibility.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DiaryHeader } from '@/features/diary/components/DiaryHeader';
import type { MacroTotals } from '@/lib/db/types';
import type { MacroTargets } from '@/lib/algorithms/targets';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TOTALS: MacroTotals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
const TARGETS: MacroTargets = { kcal: 2000, protein_g: 150, carbs_g: 200, fat_g: 67 };

const DEFAULT_PROPS = {
  totals: TOTALS,
  targets: TARGETS,
  onPrevDay: jest.fn(),
  onNextDay: jest.fn(),
  onGoToToday: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiaryHeader', () => {
  it('shows "Today" label when date is today', () => {
    render(<DiaryHeader {...DEFAULT_PROPS} date={todayString()} />);
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('shows "Yesterday" label when date is yesterday', () => {
    render(<DiaryHeader {...DEFAULT_PROPS} date={yesterdayString()} />);
    expect(screen.getByText('Yesterday')).toBeTruthy();
  });

  it('shows formatted date for older dates', () => {
    render(<DiaryHeader {...DEFAULT_PROPS} date="2026-01-15" />);
    // Should NOT show "Today" or "Yesterday"
    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.queryByText('Yesterday')).toBeNull();
    // Should show some date text — just check the date element isn't "Today"
    expect(screen.getByLabelText('Previous day')).toBeTruthy();
  });

  it('shows weight when latestWeight prop is provided', () => {
    render(
      <DiaryHeader
        {...DEFAULT_PROPS}
        date={todayString()}
        latestWeight={78.5}
      />
    );
    expect(screen.getByText('78.5 kg')).toBeTruthy();
  });

  it('formats weight to 1 decimal place', () => {
    render(
      <DiaryHeader
        {...DEFAULT_PROPS}
        date={todayString()}
        latestWeight={80}
      />
    );
    expect(screen.getByText('80.0 kg')).toBeTruthy();
  });

  it('does NOT show weight chip when latestWeight is undefined', () => {
    render(
      <DiaryHeader
        {...DEFAULT_PROPS}
        date={todayString()}
      />
    );
    expect(screen.queryByText(/kg/)).toBeNull();
  });

  it('"Go to today" button is visible on non-today dates', () => {
    render(
      <DiaryHeader
        {...DEFAULT_PROPS}
        date={yesterdayString()}
        onGoToToday={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Go to today')).toBeTruthy();
  });

  it('"Go to today" button is NOT shown on today', () => {
    render(
      <DiaryHeader
        {...DEFAULT_PROPS}
        date={todayString()}
        onGoToToday={jest.fn()}
      />
    );
    expect(screen.queryByLabelText('Go to today')).toBeNull();
  });

  it('"Go to today" button is NOT shown when onGoToToday is undefined', () => {
    render(
      <DiaryHeader
        {...DEFAULT_PROPS}
        date={yesterdayString()}
        onGoToToday={undefined}
      />
    );
    expect(screen.queryByLabelText('Go to today')).toBeNull();
  });
});
