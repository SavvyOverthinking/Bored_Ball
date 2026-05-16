/**
 * Phase 2 Router
 * Manages day transitions and determines which scene to show.
 * A 5-day run is one work week; every fifth cleared day awards a weekend bonus.
 */

import { curve, type LevelTuning } from '@game/utils/levelCurve';

/**
 * Check if clearing this calendar day should trigger a weekend bonus.
 */
export const isBonusWeek = (week: number): boolean => {
  return week > 0 && week % 5 === 0;
};

/**
 * Get the primary scene key for a calendar day.
 * Weekend stages are routed after a qualifying day is cleared, not instead of
 * that day's calendar board.
 */
export const getSceneForWeek = (_week: number): string => {
  return 'CalendarScenePhase2';
};

/**
 * Additional data to pass to scene initialization
 */
interface AdditionalSceneData {
  score?: number;
  lives?: number;
  fromWeekendBonus?: boolean;
}

/**
 * Start the appropriate scene for a given day.
 */
export function startWeek(scene: Phaser.Scene, week: number, additionalData: AdditionalSceneData = {}) {
  const tuning = curve(week);
  console.log(`📅 Day ${week} - Difficulty: ${getDifficultyName(week)}`);
  scene.scene.start('CalendarScenePhase2', {
    week,
    tuning,
    ...additionalData
  });
}

/**
 * Start the weekend bonus awarded after a calendar day is cleared.
 */
export function startWeekendBonus(
  scene: Phaser.Scene,
  completedWeek: number,
  nextWeek: number,
  additionalData: AdditionalSceneData = {}
) {
  console.log(`🌴 Day ${completedWeek} cleared - WEEKEND BONUS STAGE!`);
  scene.scene.start('WeekendStageScene', {
    week: completedWeek,
    nextWeek,
    ...additionalData
  });
}

/**
 * Get difficulty name for a week
 */
export const getDifficultyName = (week: number): string => {
  if (week <= 5) return 'Onboarding';
  if (week <= 15) return 'Easy';
  if (week <= 30) return 'Medium';
  if (week <= 45) return 'Hard';
  return 'Brutal';
};

/**
 * Calculate next week number (with wrapping at 52)
 */
export const getNextWeek = (currentWeek: number): number => {
  return currentWeek >= 52 ? 1 : currentWeek + 1;
};

/**
 * Check if this is the final week
 */
export const isFinalWeek = (week: number): boolean => {
  return week === 52;
};

/**
 * Get tuning for a specific week
 */
export const getTuningForWeek = (week: number): LevelTuning => {
  return curve(week);
};

/**
 * Phase 2 game flow metadata
 */
export const PHASE2_FLOW = {
  TOTAL_WEEKS: 52,
  BONUS_FREQUENCY: 5,     // After every 5th cleared calendar day
  INTRO_WEEKS: 5,         // Days 1-5 are easier
  STARTING_LIVES: 3,
  STARTING_SCORE: 0
};

/**
 * Get list of all bonus weeks
 */
export const getAllBonusWeeks = (): number[] => {
  const bonusWeeks: number[] = [];
  for (let w = 1; w <= 52; w++) {
    if (isBonusWeek(w)) {
      bonusWeeks.push(w);
    }
  }
  return bonusWeeks;
};

/**
 * Format day number for display
 */
export const formatWeekDisplay = (week: number): string => {
  if (isBonusWeek(week)) {
    return `Day ${week} / 52 + weekend bonus`;
  }
  return `Day ${week} / 52`;
};

export default {
  isBonusWeek,
  getSceneForWeek,
  startWeek,
  startWeekendBonus,
  getDifficultyName,
  getNextWeek,
  isFinalWeek,
  getTuningForWeek,
  PHASE2_FLOW,
  getAllBonusWeeks,
  formatWeekDisplay
};

