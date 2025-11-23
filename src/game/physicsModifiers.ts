/**
 * Physics modifiers for different meeting types
 * Each meeting type has a unique effect on the ball's behavior
 */

import Phaser from 'phaser';
import type { PhaserBall, PowerUpScene } from './types';

export type MeetingType = '1:1' | 'team' | 'boss' | 'lunch' | 'personal';

export interface PhysicsEffect {
  type: MeetingType;
  description: string;
  color: string;
  apply: (ball: PhaserBall, scene: Phaser.Scene) => void;
}

/**
 * Base ball speed for normalization
 */
const BASE_SPEED = 300;

/**
 * Apply speed modification while preserving direction
 * Uses ratio-based calculation for efficiency (faster than angle-based)
 */
function modifySpeed(ball: PhaserBall, multiplier: number) {
  const body = ball.body;
  if (!body) return;

  const velocity = body.velocity;
  // Calculate current speed using optimized method (avoid multiple property lookups)
  const vx = velocity.x;
  const vy = velocity.y;
  const currentSpeed = Math.sqrt(vx * vx + vy * vy);

  if (currentSpeed === 0) return;

  // Apply speed change using ratio (preserves direction efficiently)
  const ratio = (BASE_SPEED * multiplier) / currentSpeed;
  body.setVelocity(vx * ratio, vy * ratio);
}

/**
 * Create additional balls (split effect)
 * Optimized to calculate angle and speed once
 */
function splitBall(ball: PhaserBall, scene: Phaser.Scene): void {
  const MainScene = scene as PowerUpScene;

  if (!MainScene.createExtraBall) return;

  const body = ball.body;
  if (!body) return;

  // Calculate angle and speed once (optimization)
  const vx = body.velocity.x;
  const vy = body.velocity.y;
  const currentAngle = Math.atan2(vy, vx);
  const speed = Math.sqrt(vx * vx + vy * vy);

  // Create two extra balls at slight angle offsets
  const angleOffsets = [-15 * Math.PI / 180, 15 * Math.PI / 180]; // Pre-convert to radians

  angleOffsets.forEach(offsetRad => {
    const newAngle = currentAngle + offsetRad;

    MainScene.createExtraBall(
      ball.x,
      ball.y,
      Math.cos(newAngle) * speed,
      Math.sin(newAngle) * speed
    );
  });
}

/**
 * Physics effects for each meeting type
 */
export const PHYSICS_EFFECTS: Record<MeetingType, PhysicsEffect> = {
  '1:1': {
    type: '1:1',
    description: '+10% speed',
    color: '#5c6bc0',
    apply: (ball: PhaserBall) => {
      modifySpeed(ball, 1.1);
    }
  },

  'team': {
    type: 'team',
    description: 'Split ball',
    color: '#4caf50',
    apply: (ball: PhaserBall, scene: Phaser.Scene) => {
      splitBall(ball, scene);
    }
  },

  'boss': {
    type: 'boss',
    description: 'Speed ×1.8',
    color: '#e53935',
    apply: (ball: PhaserBall) => {
      modifySpeed(ball, 1.8);
    }
  },

  'lunch': {
    type: 'lunch',
    description: 'Normalize speed',
    color: '#fbc02d',
    apply: (ball: PhaserBall) => {
      modifySpeed(ball, 1.0);
    }
  },

  'personal': {
    type: 'personal',
    description: 'Reset bounce',
    color: '#8e24aa',
    apply: (ball: PhaserBall) => {
      // Stabilize ball direction and speed
      const body = ball.body;
      if (!body) return;

      // Optimize: cache velocity components to avoid multiple property access
      const vx = body.velocity.x;
      const vy = body.velocity.y;

      // Normalize to base speed (using angle-based approach for personal meetings)
      const currentAngle = Math.atan2(vy, vx);

      body.setVelocity(
        Math.cos(currentAngle) * BASE_SPEED,
        Math.sin(currentAngle) * BASE_SPEED
      );
    }
  }
};

/**
 * Apply physics effect based on meeting type
 */
export function applyMeetingEffect(
  meetingType: MeetingType,
  ball: PhaserBall,
  scene: Phaser.Scene
): void {
  const effect = PHYSICS_EFFECTS[meetingType];
  if (effect) {
    effect.apply(ball, scene);
  }
}


