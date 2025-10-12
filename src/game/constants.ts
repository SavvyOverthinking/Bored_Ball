/**
 * Game Constants
 * Centralized configuration for gameplay balance and physics
 */

import Phaser from 'phaser';

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

/**
 * Calculate deterministic paddle bounce angle
 * @param ballX - Ball X position
 * @param paddleX - Paddle center X
 * @param paddleWidth - Paddle width
 * @returns Angle in radians
 */
export function calculatePaddleBounceAngle(
  ballX: number,
  paddleX: number,
  paddleWidth: number
): number {
  // Get relative position on paddle (-1 to 1)
  const relativePos = (ballX - paddleX) / (paddleWidth / 2);
  const clampedPos = Phaser.Math.Clamp(relativePos, -1, 1);

  // Map to angle (-60° to 60°)
  const angle = Phaser.Math.DegToRad(Phaser.Math.Linear(-60, 60, (clampedPos + 1) / 2));

  return angle;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

