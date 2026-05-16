import { describe, expect, it } from 'vitest';
import {
  formatWeekDisplay,
  getAllBonusWeeks,
  getSceneForWeek,
  isBonusWeek,
} from '../phase2Router';

describe('phase2Router', () => {
  it('treats every fifth cleared calendar day as a bonus trigger before the finale', () => {
    expect(isBonusWeek(1)).toBe(false);
    expect(isBonusWeek(4)).toBe(false);
    expect(isBonusWeek(5)).toBe(true);
    expect(isBonusWeek(10)).toBe(true);
    expect(isBonusWeek(25)).toBe(false);
  });

  it('keeps direct week navigation on the calendar scene', () => {
    expect(getSceneForWeek(5)).toBe('CalendarScenePhase2');
    expect(getSceneForWeek(10)).toBe('CalendarScenePhase2');
  });

  it('lists all weekend bonus trigger weeks', () => {
    expect(getAllBonusWeeks()).toEqual([5, 10, 15, 20]);
  });

  it('labels bonus weeks as post-clear rewards', () => {
    expect(formatWeekDisplay(5)).toBe('Day 5 / 25 + weekend bonus');
    expect(formatWeekDisplay(6)).toBe('Day 6 / 25');
    expect(formatWeekDisplay(25)).toBe('Day 25 / 25');
  });
});
