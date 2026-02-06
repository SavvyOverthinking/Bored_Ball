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
 * CLASSIC ARCADE PROGRESSION:
 * - Weeks 1-10: Paddle shrinks from 1.4 to 0.9 (arcade style)
 * - Weeks 11+: Paddle stays at 0.9 (plateau)
 */
export const curve = (week: number): LevelTuning => {
  const w = Math.max(1, Math.min(52, week));

  // ARCADE PADDLE SCALING: Shrinks over first 10 weeks, then plateaus
  const getPaddleScale = (week: number): number => {
    if (week <= 1) return 1.4;    // Week 1: Biggest paddle
    if (week >= 10) return 0.9;   // Week 10+: Smallest (plateau)
    // Linear interpolation from 1.4 to 0.9 over weeks 1-10
    const t = (week - 1) / 9;     // 0 at week 1, 1 at week 10
    return 1.4 - 0.5 * t;         // 1.4 → 0.9
  };

  // ARCADE BALL SPEED: Gets faster over first 10 weeks, then plateaus
  const getBallSpeed = (week: number): number => {
    if (week <= 1) return 200;    // Week 1: Slowest
    if (week >= 10) return 280;   // Week 10+: Fastest (plateau)
    const t = (week - 1) / 9;
    return Math.round(200 + 80 * t);
  };

  // Weeks 1-10: Arcade progression
  if (w <= 10) {
    return {
      week: w,
      density: 0.30 + w * 0.02,          // 32% → 50%
      bossRate: w <= 2 ? 0 : 0.02 + (w - 2) * 0.01,  // 0% weeks 1-2, then grows
      teamRate: w <= 2 ? 0.05 : 0.08 + (w - 2) * 0.01,
      lunchRate: 0.20,
      minBlockMins: w <= 5 ? 60 : 45,    // Bigger blocks early
      ballMaxCount: 2,
      paddleScale: getPaddleScale(w),
      baseSpeed: getBallSpeed(w)
    };
  }

  // Weeks 11-20: Transition period (paddle stays at plateau)
  if (w <= 20) {
    return {
      week: w,
      density: 0.50 + (w - 10) * 0.02,   // 50% → 70%
      bossRate: 0.10,
      teamRate: 0.15,
      lunchRate: 0.15,
      minBlockMins: 30,
      ballMaxCount: 3,
      paddleScale: 0.9,                   // Plateau
      baseSpeed: 280                      // Plateau
    };
  }

  // Weeks 21-52: Full difficulty (paddle and speed stay at plateau)
  const t = (w - 20) / 32; // Interpolation factor 0 to 1 (from week 21 to 52)

  return {
    week: w,
    density: 0.50 + 0.30 * t,              // 50% → 80%
    bossRate: 0.10 + 0.05 * t,             // 10% → 15%
    teamRate: 0.15 + 0.10 * t,             // 15% → 25%
    lunchRate: 0.15 - 0.05 * t,            // 15% → 10% (less relief)
    minBlockMins: 30 - Math.round(15 * t), // 30min → 15min (smaller targets)
    ballMaxCount: 3 + Math.round(1 * t),   // 3 → 4 balls
    paddleScale: 0.9,                       // Plateau (doesn't shrink more)
    baseSpeed: 280 + Math.round(20 * t)    // 280 → 300 px/s (slight increase)
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

