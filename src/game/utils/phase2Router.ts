/**
 * Phase 2 Router
 * Manages week transitions and determines which scene to show
 * - Regular weeks: CalendarScenePhase2
 * - Every 5th completed calendar week: WeekendStageScene bonus
 */

import { curve, type LevelTuning } from '@game/utils/levelCurve';

/**
 * Check if clearing this calendar week should trigger a weekend bonus.
 */
export const isBonusWeek = (week: number): boolean => {
  return week > 0 && week % 5 === 0;
};

/**
 * Get the primary scene key for a calendar week.
 * Weekend stages are routed after a qualifying week is cleared, not instead of
 * that week's calendar board.
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
 * Start the appropriate scene for a given week
 */
export function startWeek(scene: Phaser.Scene, week: number, additionalData: AdditionalSceneData = {}) {
  const tuning = curve(week);
  console.log(`📅 Week ${week} - Difficulty: ${getDifficultyName(week)}`);
  scene.scene.start('CalendarScenePhase2', {
    week,
    tuning,
    ...additionalData
  });
}

/**
 * Start the weekend bonus awarded after a calendar week is cleared.
 */
export function startWeekendBonus(
  scene: Phaser.Scene,
  completedWeek: number,
  nextWeek: number,
  additionalData: AdditionalSceneData = {}
) {
  console.log(`🌴 Week ${completedWeek} cleared - WEEKEND BONUS STAGE!`);
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
  BONUS_FREQUENCY: 5,     // After every 5th cleared calendar week
  INTRO_WEEKS: 5,         // Weeks 1-5 are easier
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
 * Format week number for display
 */
export const formatWeekDisplay = (week: number): string => {
  if (isBonusWeek(week)) {
    return `Week ${week} / 52 + weekend bonus`;
  }
  return `Week ${week} / 52`;
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

