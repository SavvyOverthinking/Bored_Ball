/**
 * Game Constants
 * Centralized configuration for gameplay balance and physics
 */

export const CANVAS = {
  WIDTH: 900,
  HEIGHT: 640,
};

export const PHYSICS = {
  BASE_SPEED: 260,
  MIN_SPEED: 200,
  MAX_SPEED: 700,
  SPLIT_COUNT: 2,
  PADDLE_WIDTH: 140,
  PADDLE_HEIGHT: 16,
  BALL_RADIUS: 8,
  MAX_BALLS: 3,
};

export const WORK_HOURS = {
  START: 9,
  END: 17,
  DAYS: 5, // Mon–Fri
};

export const GAME = {
  TOTAL_WEEKS: 52,
  INITIAL_LIVES: 3,
};

/**
 * Clamp velocity to prevent runaway physics
 */
export function clampVelocity(v: Phaser.Math.Vector2): Phaser.Math.Vector2 {
  const len = Phaser.Math.Clamp(v.length(), PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
  return v.setLength(len);
}

