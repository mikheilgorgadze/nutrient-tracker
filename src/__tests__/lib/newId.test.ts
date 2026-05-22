/**
 * newId() — must work in Hermes (no global crypto).
 * setup.ts deletes global.crypto to simulate the Hermes environment.
 */
import { newId } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  it('returns a valid UUID v4', () => {
    expect(newId()).toMatch(UUID_RE);
  });

  it('returns unique values on repeated calls', () => {
    const ids = new Set(Array.from({ length: 100 }, newId));
    expect(ids.size).toBe(100);
  });

  it('does not use crypto (would throw in Hermes)', () => {
    expect(global.crypto).toBeUndefined();
    // If newId() called crypto.randomUUID() it would have thrown above
    expect(() => newId()).not.toThrow();
  });
});
