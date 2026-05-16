/**
 * Campaign tuning for the 25-day Phase 2 arc.
 *
 * One board is one workday. Five workdays make one week, with a short weekend
 * bonus after days 5, 10, 15, and 20. Day 25 is the finale.
 */

import { CAMPAIGN_TOTAL_DAYS } from './campaign';

export type LevelTuning = {
  week: number;
  density: number;
  bossRate: number;
  teamRate: number;
  lunchRate: number;
  minBlockMins: number;
  ballMaxCount: number;
  paddleScale: number;
  baseSpeed: number;
};

function clampDay(day: number): number {
  return Math.max(1, Math.min(CAMPAIGN_TOTAL_DAYS, day));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Calculate level tuning for a given campaign day.
 */
export const curve = (week: number): LevelTuning => {
  const w = clampDay(week);

  if (w <= 5) {
    const t = (w - 1) / 4;
    return {
      week: w,
      density: 0.22 + 0.12 * t,
      bossRate: w < 5 ? 0 : 0.03,
      teamRate: w < 4 ? 0 : 0.07,
      lunchRate: w < 3 ? 0 : 0.24,
      minBlockMins: 60,
      ballMaxCount: 2,
      paddleScale: Number(lerp(1.45, 1.25, t).toFixed(2)),
      baseSpeed: Math.round(lerp(200, 230, t)),
    };
  }

  if (w <= 15) {
    const t = (w - 6) / 9;
    return {
      week: w,
      density: 0.36 + 0.18 * t,
      bossRate: 0.05 + 0.04 * t,
      teamRate: 0.09 + 0.07 * t,
      lunchRate: 0.20 - 0.03 * t,
      minBlockMins: w < 11 ? 45 : 30,
      ballMaxCount: w < 10 ? 2 : 3,
      paddleScale: Number(lerp(1.2, 1.0, t).toFixed(2)),
      baseSpeed: Math.round(lerp(235, 265, t)),
    };
  }

  const t = (w - 16) / 9;
  return {
    week: w,
    density: 0.56 + 0.12 * t,
    bossRate: 0.10 + 0.04 * t,
    teamRate: 0.16 + 0.06 * t,
    lunchRate: 0.15 - 0.05 * t,
    minBlockMins: w < 22 ? 30 : 15,
    ballMaxCount: w < 21 ? 3 : 4,
    paddleScale: Number(lerp(0.98, 0.92, t).toFixed(2)),
    baseSpeed: Math.round(lerp(270, 295, t)),
  };
};

/**
 * Get a formatted description of the current difficulty.
 */
export const describeDifficulty = (week: number): string => {
  const w = clampDay(week);
  if (w <= 5) return 'Week 1 - Onboarding';
  if (w <= 10) return 'Week 2 - Team Ramp';
  if (w <= 15) return 'Week 3 - Meeting Creep';
  if (w <= 20) return 'Week 4 - Calendar Crunch';
  return 'Week 5 - Final Friday';
};

/**
 * Calculate expected playtime for a day.
 */
export const estimatedMinutes = (week: number): number => {
  const tuning = curve(week);
  return Math.max(3, Math.round(tuning.density * 9 + (week > 20 ? 1 : 0)));
};

export default curve;
