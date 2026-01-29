import Phaser from 'phaser';
import type { PhaserBall, PowerUpScene } from '@/types/game';

// Extended MeetingType with 5 new types
export type MeetingType =
  | '1:1'
  | 'team'
  | 'boss'
  | 'lunch'
  | 'personal'
  | 'sticky'
  // New types
  | 'recurring'   // Spawns follow-up block when destroyed
  | 'allhands'    // Damages adjacent blocks when destroyed
  | 'focus'       // Ball passes through, grants score bonus
  | 'emergency'   // Timer - must destroy before time runs out
  | 'optional';   // Can ignore, but 3x points if destroyed

export interface PhysicsEffect {
  type: MeetingType;
  description: string;
  color: string;
  hitPoints: number;
  apply: (ball: PhaserBall, scene: Phaser.Scene) => void;
}

// Meeting type metadata for generation and display
export interface MeetingTypeInfo {
  type: MeetingType;
  name: string;
  description: string;
  color: string;
  hitPoints: number;
  minWeek: number;      // Minimum week to appear
  maxPerWeek?: number;  // Maximum instances per week (undefined = no limit)
  pointsMultiplier?: number; // Score multiplier (default 1)
}

export const MEETING_TYPE_INFO: Record<MeetingType, MeetingTypeInfo> = {
  '1:1': {
    type: '1:1',
    name: '1:1 Meeting',
    description: '+10% ball speed',
    color: '#5c6bc0',
    hitPoints: 2,
    minWeek: 1
  },
  'team': {
    type: 'team',
    name: 'Team Meeting',
    description: 'Splits ball into multiple',
    color: '#4caf50',
    hitPoints: 2,
    minWeek: 1
  },
  'boss': {
    type: 'boss',
    name: 'Boss Meeting',
    description: 'Ball speed x1.8!',
    color: '#e53935',
    hitPoints: 3,
    minWeek: 3
  },
  'lunch': {
    type: 'lunch',
    name: 'Lunch Break',
    description: 'Normalizes ball speed',
    color: '#fbc02d',
    hitPoints: 1,
    minWeek: 1
  },
  'personal': {
    type: 'personal',
    name: 'Personal Time',
    description: 'Resets ball trajectory',
    color: '#8e24aa',
    hitPoints: 1,
    minWeek: 1
  },
  'sticky': {
    type: 'sticky',
    name: 'Sticky Note',
    description: 'Ball sticks for 0.5s',
    color: '#9E9E9E',
    hitPoints: 1,
    minWeek: 6
  },
  // New types
  'recurring': {
    type: 'recurring',
    name: 'Recurring Meeting',
    description: 'Spawns a follow-up when destroyed',
    color: '#2e7d32', // Darker green with cycle icon
    hitPoints: 2,
    minWeek: 15
  },
  'allhands': {
    type: 'allhands',
    name: 'All-Hands Meeting',
    description: 'Damages adjacent blocks on destroy',
    color: '#ff6d00', // Orange gradient
    hitPoints: 5,
    minWeek: 25,
    maxPerWeek: 2
  },
  'focus': {
    type: 'focus',
    name: 'Focus Time',
    description: 'Ball passes through, +5s 50% score bonus',
    color: '#00897b', // Teal
    hitPoints: 1,
    minWeek: 1,
    pointsMultiplier: 1.5
  },
  'emergency': {
    type: 'emergency',
    name: 'Emergency Meeting',
    description: '8s timer - lose life if not destroyed!',
    color: '#d32f2f', // Flashing red
    hitPoints: 2,
    minWeek: 30
  },
  'optional': {
    type: 'optional',
    name: 'Optional Meeting',
    description: 'Can ignore, but 3x points if destroyed',
    color: '#78909c', // Grey-blue with dashed border
    hitPoints: 1,
    minWeek: 1,
    pointsMultiplier: 3
  }
};

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

function applyStickyEffect(ball: PhaserBall, scene: Phaser.Scene): void {
  const body = ball.body as Phaser.Physics.Arcade.Body;
  if (!body) return;

  const originalVelocityX = body.velocity.x;
  const originalVelocityY = body.velocity.y;

  body.setVelocity(0, 0);
  body.setImmovable(true);
  body.setCollideWorldBounds(false);

  scene.time.delayedCall(500, () => {
    if (ball.active && body) {
      body.setImmovable(false);
      body.setCollideWorldBounds(true);

      const nudgeAngle = Phaser.Math.Between(-30, 30) * Math.PI / 180;
      const nudgeSpeed = BASE_SPEED * 0.7;

      body.setVelocity(
        Math.cos(nudgeAngle) * nudgeSpeed * (originalVelocityX > 0 ? 1 : -1),
        Math.sin(nudgeAngle) * nudgeSpeed * (originalVelocityY > 0 ? 1 : -1)
      );
    }
  });
}

// Focus time effect - grants temporary score bonus
function applyFocusEffect(_ball: PhaserBall, scene: Phaser.Scene): void {
  // The scene should handle the score bonus via a method
  const gameScene = scene as PowerUpScene & { grantFocusBonus?: (duration: number) => void };
  if (gameScene.grantFocusBonus) {
    gameScene.grantFocusBonus(5000); // 5 seconds of 50% score bonus
  }
}

export const PHYSICS_EFFECTS: Record<MeetingType, PhysicsEffect> = {
  '1:1': {
    type: '1:1',
    description: '+10% speed',
    color: '#5c6bc0',
    hitPoints: 2,
    apply: (ball: PhaserBall) => {
      modifySpeed(ball, 1.1);
    }
  },

  'team': {
    type: 'team',
    description: 'Split ball',
    color: '#4caf50',
    hitPoints: 2,
    apply: (ball: PhaserBall, scene: Phaser.Scene) => {
      splitBall(ball, scene);
    }
  },

  'boss': {
    type: 'boss',
    description: 'Speed ×1.8',
    color: '#e53935',
    hitPoints: 3,
    apply: (ball: PhaserBall) => {
      modifySpeed(ball, 1.8);
    }
  },

  'lunch': {
    type: 'lunch',
    description: 'Normalize speed',
    color: '#fbc02d',
    hitPoints: 1,
    apply: (ball: PhaserBall) => {
      modifySpeed(ball, 1.0);
    }
  },

  'personal': {
    type: 'personal',
    description: 'Reset bounce',
    color: '#8e24aa',
    hitPoints: 1,
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

  'sticky': {
    type: 'sticky',
    description: 'Ball sticks for 0.5s',
    color: '#9E9E9E',
    hitPoints: 1,
    apply: (ball: PhaserBall, scene: Phaser.Scene) => {
      applyStickyEffect(ball, scene);
    }
  },

  // New meeting types
  'recurring': {
    type: 'recurring',
    description: 'Spawns follow-up',
    color: '#2e7d32',
    hitPoints: 2,
    apply: (_ball: PhaserBall) => {
      // Effect handled in scene's onBlockDestroyed callback
      // No immediate ball effect
    }
  },

  'allhands': {
    type: 'allhands',
    description: 'Damages adjacent',
    color: '#ff6d00',
    hitPoints: 5,
    apply: (_ball: PhaserBall) => {
      // Effect handled in scene's onBlockDestroyed callback
      // No immediate ball effect
    }
  },

  'focus': {
    type: 'focus',
    description: '+50% score for 5s',
    color: '#00897b',
    hitPoints: 1,
    apply: (ball: PhaserBall, scene: Phaser.Scene) => {
      applyFocusEffect(ball, scene);
    }
  },

  'emergency': {
    type: 'emergency',
    description: '8s timer!',
    color: '#d32f2f',
    hitPoints: 2,
    apply: (_ball: PhaserBall) => {
      // Timer is managed by scene when block is created
      // No immediate ball effect
    }
  },

  'optional': {
    type: 'optional',
    description: '3x points',
    color: '#78909c',
    hitPoints: 1,
    apply: (_ball: PhaserBall) => {
      // Score multiplier handled in scene's scoring logic
      // No immediate ball effect
    }
  }
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

/**
 * Get default hit points for a meeting type
 */
export function getDefaultHitPoints(meetingType: MeetingType): number {
  return MEETING_TYPE_INFO[meetingType]?.hitPoints || 1;
}

/**
 * Get points multiplier for a meeting type
 */
export function getPointsMultiplier(meetingType: MeetingType): number {
  return MEETING_TYPE_INFO[meetingType]?.pointsMultiplier || 1;
}

/**
 * Check if meeting type can appear in a given week
 */
export function canAppearInWeek(meetingType: MeetingType, week: number): boolean {
  const info = MEETING_TYPE_INFO[meetingType];
  return info ? week >= info.minWeek : true;
}
