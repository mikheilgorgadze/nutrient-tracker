/**
 * getLogStreak — unit tests.
 *
 * We mock db.getAllSync to return fake diary dates and verify the JS streak
 * counting logic works correctly in all edge cases.
 */
import { createMockDb } from '@/test/mocks/db';
import { getLogStreak } from '@/lib/db/queries/progress';

/** Returns a YYYY-MM-DD string for today minus `n` days. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('getLogStreak', () => {
  it('returns 0 when there are no diary entries', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([]);
    expect(getLogStreak(db as never)).toBe(0);
  });

  it('returns 1 when only today has entries', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([{ date: daysAgo(0) }]);
    expect(getLogStreak(db as never)).toBe(1);
  });

  it('returns 2 when today and yesterday have entries', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([
      { date: daysAgo(0) },
      { date: daysAgo(1) },
    ]);
    expect(getLogStreak(db as never)).toBe(2);
  });

  it('returns 3 when today, yesterday, and the day before have entries', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([
      { date: daysAgo(0) },
      { date: daysAgo(1) },
      { date: daysAgo(2) },
    ]);
    expect(getLogStreak(db as never)).toBe(3);
  });

  it('returns 0 when the last entry was 2 days ago (gap breaks streak)', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([{ date: daysAgo(2) }]);
    expect(getLogStreak(db as never)).toBe(0);
  });

  it('counts streak from yesterday when there is no entry today', () => {
    const db = createMockDb();
    db.getAllSync.mockReturnValue([
      { date: daysAgo(1) },
      { date: daysAgo(2) },
      { date: daysAgo(3) },
    ]);
    // Streak = 3 (yesterday, day before, day before that)
    expect(getLogStreak(db as never)).toBe(3);
  });

  it('continues streak even if there are multiple entries on the same day', () => {
    const db = createMockDb();
    // Same date appears multiple times (e.g. multiple meals logged)
    db.getAllSync.mockReturnValue([
      { date: daysAgo(0) },
      { date: daysAgo(0) },  // duplicate for today
      { date: daysAgo(1) },
      { date: daysAgo(1) },  // duplicate for yesterday
      { date: daysAgo(2) },
    ]);
    // DISTINCT is applied in SQL; JS set deduplication means streak = 3
    expect(getLogStreak(db as never)).toBe(3);
  });

  it('stops streak at the first gap', () => {
    const db = createMockDb();
    // Today, yesterday, then a gap (day 3 missing), then older entries
    db.getAllSync.mockReturnValue([
      { date: daysAgo(0) },
      { date: daysAgo(1) },
      // day 2 is missing — gap here
      { date: daysAgo(3) },
      { date: daysAgo(4) },
    ]);
    // Streak should be 2 (today + yesterday only)
    expect(getLogStreak(db as never)).toBe(2);
  });
});
