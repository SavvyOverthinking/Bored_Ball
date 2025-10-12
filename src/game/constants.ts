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
 * Calculate paddle bounce angle with "English" (classic Breakout physics)
 * Paddle is divided into 7 zones with distinct rebound angles
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
  // Get relative position on paddle (-1 to 1, left to right)
  const relativePos = (ballX - paddleX) / (paddleWidth / 2);
  const clampedPos = Phaser.Math.Clamp(relativePos, -1, 1);

  // Classic Breakout "English" - Paddle divided into 7 zones:
  // Zone 1 (far left):   -85° to -70° (very sharp left)
  // Zone 2:              -65° to -45° (sharp left)
  // Zone 3:              -35° to -20° (moderate left)
  // Zone 4 (center):     -10° to +10° (mostly straight up)
  // Zone 5:              +20° to +35° (moderate right)
  // Zone 6:              +45° to +65° (sharp right)
  // Zone 7 (far right):  +70° to +85° (very sharp right)

  let angle: number;
  const absPos = Math.abs(clampedPos);
  const sign = Math.sign(clampedPos);

  if (absPos < 0.14) {
    // Center zone (±14% of paddle) - Nearly straight up
    angle = Phaser.Math.DegToRad(Phaser.Math.Linear(0, 10, absPos / 0.14) * sign);
  } else if (absPos < 0.35) {
    // Inner zone (14%-35%) - Moderate angle
    const t = (absPos - 0.14) / (0.35 - 0.14);
    angle = Phaser.Math.DegToRad(Phaser.Math.Linear(20, 35, t) * sign);
  } else if (absPos < 0.65) {
    // Middle zone (35%-65%) - Sharp angle
    const t = (absPos - 0.35) / (0.65 - 0.35);
    angle = Phaser.Math.DegToRad(Phaser.Math.Linear(45, 65, t) * sign);
  } else {
    // Outer zone (65%-100%) - Very sharp angle (for tricky shots)
    const t = (absPos - 0.65) / (1.0 - 0.65);
    angle = Phaser.Math.DegToRad(Phaser.Math.Linear(70, 85, t) * sign);
  }

  return angle;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

