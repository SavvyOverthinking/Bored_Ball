/**
 * Level Curve System - Phase 2
 * Provides progressive difficulty scaling across 52 weeks
 */

export type LevelTuning = {
  week: number;
  density: number;        // Meeting density 0-1 (% of calendar filled)
  bossRate: number;       // Boss meeting spawn rate 0-1
  teamRate: number;       // Team meeting spawn rate 0-1
  lunchRate: number;      // Lunch break spawn rate 0-1 (relief)
  minBlockMins: number;   // Minimum meeting duration: 15/30/45/60
  ballMaxCount: number;   // Maximum simultaneous balls (for team splits)
  paddleScale: number;    // Paddle width multiplier (1 = normal)
  baseSpeed: number;      // Ball base speed in px/s
};

/**
 * Calculate level tuning for a given week
 * Weeks 1-2: Gentle introduction with larger paddle, slower speed (handled by special generators)
 * Weeks 3-20: Progressive ramp-up (handled by generateWeeks3to20Progressive)
 * Weeks 21-52: Progressive difficulty increase (used by this curve function)
 */
export const curve = (week: number): LevelTuning => {
  const w = Math.max(1, Math.min(52, week));

  // Weeks 1-20: Early progressive period (this tuning is mainly for reference)
  if (w <= 20) {
    return {
      week: w,
      density: 0.35,           // 35% calendar filled (lots of breathing room)
      bossRate: 0.04,          // 4% boss meetings (rare)
      teamRate: 0.10,          // 10% team meetings (occasional splits)
      lunchRate: 0.20,         // 20% lunch breaks (more relief)
      minBlockMins: 45,        // Larger 45+ minute blocks (easier targets)
      ballMaxCount: 2,         // Max 2 balls (limited chaos)
      paddleScale: 1.2,        // 20% wider paddle (forgiving)
      baseSpeed: 220           // Slower ball speed (easier to track)
    };
  }
  
  // Weeks 21-52: Progressive difficulty curve
  const t = (w - 20) / 32; // Interpolation factor 0 to 1 (from week 21 to 52)
  
  return {
    week: w,
    density: 0.35 + 0.45 * t,              // 35% → 80%
    bossRate: 0.04 + 0.10 * t,             // 4% → 14%
    teamRate: 0.10 + 0.15 * t,             // 10% → 25%
    lunchRate: 0.20 - 0.10 * t,            // 20% → 10% (less relief)
    minBlockMins: 45 - Math.round(30 * t), // 45min → 15min (smaller targets)
    ballMaxCount: 2 + Math.round(2 * t),   // 2 → 4 balls (more chaos)
    paddleScale: 1.2 - 0.35 * t,           // 1.2× → 0.85× (harder)
    baseSpeed: Math.round(220 + 80 * t)    // 220 → 300 px/s (faster)
  };
};

/**
 * Get a formatted description of the current difficulty
 */
export const describeDifficulty = (week: number): string => {
  if (week <= 2) return 'Onboarding Week - Easy Mode';
  if (week <= 10) return 'Early Career - Learning';
  if (week <= 20) return 'Progressive Ramp - Manageable';
  if (week <= 35) return 'Mid-Year Crunch - Challenging';
  if (week <= 45) return 'Year-End Chaos - Hard';
  return 'Burnout Season - Brutal';
};

/**
 * Calculate expected playtime for a week (for analytics)
 */
export const estimatedMinutes = (week: number): number => {
  const tuning = curve(week);
  // Rough estimate: density * 10 minutes baseline
  return Math.round(tuning.density * 10 + (week > 30 ? 3 : 0));
};

export default curve;

