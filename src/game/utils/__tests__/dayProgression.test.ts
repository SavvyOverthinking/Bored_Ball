import { describe, expect, it } from 'vitest';
import { getInitialDay, readDayOverride } from '../dayProgression';

describe('dayProgression URL helpers', () => {
  it('prefers day over legacy week query params', () => {
    expect(readDayOverride('?week=4&day=6')).toBe(6);
  });

  it('keeps legacy week links working', () => {
    expect(readDayOverride('?week=5')).toBe(5);
  });

  it('rejects invalid day values', () => {
    expect(readDayOverride('?day=0')).toBeUndefined();
    expect(readDayOverride('?day=26')).toBeUndefined();
    expect(readDayOverride('?day=banana')).toBeUndefined();
  });

  it('defaults to day 1 without an override', () => {
    expect(getInitialDay('')).toBe(1);
  });
});
