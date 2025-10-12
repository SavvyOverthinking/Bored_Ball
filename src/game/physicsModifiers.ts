/**
 * Physics modifiers for different meeting types
 * Each meeting type has a unique effect on the ball's behavior
 */

import Phaser from 'phaser';

export type MeetingType = '1:1' | 'team' | 'boss' | 'lunch' | 'personal';

export interface PhysicsEffect {
  type: MeetingType;
  description: string;
  color: string;
  apply: (ball: any, scene: Phaser.Scene) => void;
}

/**
 * Base ball speed for normalization
 */
const BASE_SPEED = 300;

/**
 * Apply speed modification while preserving direction
 */
function modifySpeed(ball: any, multiplier: number) {
  const body = ball.body as Phaser.Physics.Arcade.Body;
  if (!body) return;

  const velocity = body.velocity;
  const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  if (currentSpeed === 0) return;

  const newSpeed = BASE_SPEED * multiplier;
  const ratio = newSpeed / currentSpeed;

  body.setVelocity(velocity.x * ratio, velocity.y * ratio);
}

/**
 * Create additional balls (split effect)
 */
function splitBall(ball: any, scene: Phaser.Scene): void {
  const MainScene = scene as any;
  
  if (!MainScene.createExtraBall) return;
  
  const body = ball.body as Phaser.Physics.Arcade.Body;
  if (!body) return;
  
  // Create two extra balls at slight angle offsets
  const angles = [-15, 15]; // degrees offset
  
  angles.forEach(angleOffset => {
    const velocity = body.velocity;

    const currentAngle = Math.atan2(velocity.y, velocity.x);
    const newAngle = currentAngle + (angleOffset * Math.PI / 180);
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

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
    apply: (ball: any) => {
      modifySpeed(ball, 1.1);
    }
  },
  
  'team': {
    type: 'team',
    description: 'Split ball',
    color: '#4caf50',
    apply: (ball: any, scene: Phaser.Scene) => {
      splitBall(ball, scene);
    }
  },
  
  'boss': {
    type: 'boss',
    description: 'Speed ×1.8',
    color: '#e53935',
    apply: (ball: any) => {
      modifySpeed(ball, 1.8);
    }
  },
  
  'lunch': {
    type: 'lunch',
    description: 'Normalize speed',
    color: '#fbc02d',
    apply: (ball: any) => {
      modifySpeed(ball, 1.0);
    }
  },
  
  'personal': {
    type: 'personal',
    description: 'Reset bounce',
    color: '#8e24aa',
    apply: (ball: any) => {
      // Stabilize ball direction and speed
      const body = ball.body as Phaser.Physics.Arcade.Body;
      if (!body) return;

      const velocity = body.velocity;

      // Normalize to base speed and reduce extreme angles
      const currentAngle = Math.atan2(velocity.y, velocity.x);
      const adjustedAngle = currentAngle;

      body.setVelocity(
        Math.cos(adjustedAngle) * BASE_SPEED,
        Math.sin(adjustedAngle) * BASE_SPEED
      );
    }
  }
};

/**
 * Apply physics effect based on meeting type
 */
export function applyMeetingEffect(
  meetingType: MeetingType,
  ball: any,
  scene: Phaser.Scene
): void {
  const effect = PHYSICS_EFFECTS[meetingType];
  if (effect) {
    effect.apply(ball, scene);
  }
}


