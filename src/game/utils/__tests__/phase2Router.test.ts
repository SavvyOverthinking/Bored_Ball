import { describe, expect, it } from 'vitest';
import {
  formatWeekDisplay,
  getAllBonusWeeks,
  getSceneForWeek,
  isBonusWeek,
} from '../phase2Router';

describe('phase2Router', () => {
  it('treats every fifth cleared calendar week as a bonus trigger', () => {
    expect(isBonusWeek(1)).toBe(false);
    expect(isBonusWeek(4)).toBe(false);
    expect(isBonusWeek(5)).toBe(true);
    expect(isBonusWeek(10)).toBe(true);
    expect(isBonusWeek(52)).toBe(false);
  });

  it('keeps direct week navigation on the calendar scene', () => {
    expect(getSceneForWeek(5)).toBe('CalendarScenePhase2');
    expect(getSceneForWeek(10)).toBe('CalendarScenePhase2');
  });

  it('lists all weekend bonus trigger weeks', () => {
    expect(getAllBonusWeeks()).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
  });

  it('labels bonus weeks as post-clear rewards', () => {
    expect(formatWeekDisplay(5)).toBe('Day 5 / 52 + weekend bonus');
    expect(formatWeekDisplay(6)).toBe('Day 6 / 52');
  });
});
