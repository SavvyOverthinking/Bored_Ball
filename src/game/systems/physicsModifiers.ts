import Phaser from 'phaser';
import type { PhaserBall, PowerUpScene } from '@/types/game';

// Add 'sticky' to MeetingType
export type MeetingType = '1:1' | 'team' | 'boss' | 'lunch' | 'personal' | 'sticky';

export interface PhysicsEffect {
  type: MeetingType;
  description: string;
  color: string;
  apply: (ball: PhaserBall, scene: Phaser.Scene) => void;
}

const BASE_SPEED = 300;

function modifySpeed(ball: PhaserBall, multiplier: number) {
  const body = ball.body;
  if (!body) return;

  const vx = body.velocity.x;
  const vy = body.velocity.y;
  const currentSpeed = Math.sqrt(vx * vx + vy * vy);

  if (currentSpeed === 0) return;

  const ratio = (BASE_SPEED * multiplier) / currentSpeed;
  body.setVelocity(vx * ratio, vy * ratio);
}

function splitBall(ball: PhaserBall, scene: Phaser.Scene): void {
  const MainScene = scene as PowerUpScene;

  if (!MainScene.createExtraBall) return;

  const body = ball.body;
  if (!body) return;

  const vx = body.velocity.x;
  const vy = body.velocity.y;
  const currentAngle = Math.atan2(vy, vx);
  const speed = Math.sqrt(vx * vx + vy * vy);

  const angleOffsets = [-15 * Math.PI / 180, 15 * Math.PI / 180];

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

// --- NEW: Sticky ball effect ---
function applyStickyEffect(ball: PhaserBall, scene: Phaser.Scene): void {
  const body = ball.body as Phaser.Physics.Arcade.Body;
  if (!body) return;

  // Store original velocity to restore after being unstuck
  const originalVelocityX = body.velocity.x;
  const originalVelocityY = body.velocity.y;

  // Stop the ball
  body.setVelocity(0, 0);
  body.setImmovable(true); // Make the ball immovable
  body.setCollideWorldBounds(false); // Temporarily disable world bounds collision

  // After a short delay, unstick the ball and give it a nudge
  scene.time.delayedCall(500, () => {
    if (ball.active && body) { // Check if ball still exists
      body.setImmovable(false);
      body.setCollideWorldBounds(true); // Re-enable world bounds collision

      // Give it a small push in a slightly random direction
      const nudgeAngle = Phaser.Math.Between(-30, 30) * Math.PI / 180;
      const nudgeSpeed = BASE_SPEED * 0.7; // Start slower
      
      body.setVelocity(
        Math.cos(nudgeAngle) * nudgeSpeed * (originalVelocityX > 0 ? 1 : -1), // Retain general horizontal direction
        Math.sin(nudgeAngle) * nudgeSpeed * (originalVelocityY > 0 ? 1 : -1) // Retain general vertical direction
      );
    }
  });
}
// --- END NEW ---

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
      const body = ball.body;
      if (!body) return;

      const vx = body.velocity.x;
      const vy = body.velocity.y;
      const currentAngle = Math.atan2(vy, vx);

      body.setVelocity(
        Math.cos(currentAngle) * BASE_SPEED,
        Math.sin(currentAngle) * BASE_SPEED
      );
    }
  },
  // --- NEW: Sticky Meeting Type ---
  'sticky': {
    type: 'sticky',
    description: 'Ball sticks for 0.5s',
    color: '#9E9E9E', // Grey color for sticky
    apply: (ball: PhaserBall, scene: Phaser.Scene) => {
      applyStickyEffect(ball, scene);
    }
  }
  // --- END NEW ---
};

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