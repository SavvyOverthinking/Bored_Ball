/**
 * TypeScript Type Definitions for Bored Ball Game
 * Provides strict type safety for Phaser game objects and custom game entities
 */

import Phaser from 'phaser';
import { MeetingType } from './physicsModifiers';

/**
 * Extended Phaser Ball with physics body and custom properties
 * Represents a ball game object with full physics integration
 */
export interface PhaserBall extends Phaser.GameObjects.Arc {
  body: Phaser.Physics.Arcade.Body | null;
  x: number;
  y: number;
  active: boolean;
  visible: boolean;
}

/**
 * Extended Phaser Block (Graphics or Rectangle) with physics body and custom data
 * Represents meeting blocks on the calendar grid
 */
export interface PhaserBlock extends Phaser.GameObjects.Rectangle {
  body: Phaser.Physics.Arcade.Body;
  x: number;
  y: number;
  width: number;
  height: number;
  getData(key: 'meetingType'): MeetingType;
  getData(key: 'blockId'): string;
  getData(key: string): unknown;
  setData(key: string, value: unknown): this;
}

/**
 * Block data structure for calendar meetings
 */
export interface BlockData {
  id: string;
  title: string;
  type: MeetingType;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Power-up container with physics body
 */
export interface PowerUpContainer extends Phaser.GameObjects.Container {
  body: Phaser.Physics.Arcade.Body;
  active: boolean;
  list: Array<Phaser.GameObjects.Text>;
}

/**
 * Phaser game object with custom data storage
 */
export interface GameObjectWithData extends Phaser.GameObjects.GameObject {
  getData(key: string): unknown;
  setData(key: string, value: unknown): this;
}

/**
 * Ball position history entry for stuck detection
 */
export interface BallPositionEntry {
  x: number;
  y: number;
  time: number;
}

/**
 * Extended Phaser Rectangle or Sprite with physics (for paddle)
 */
export type PhaserPaddle = (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite) & {
  body: Phaser.Physics.Arcade.Body | null;
};

/**
 * Scene interface with power-up methods (for Phase 2)
 * Extends base Phaser.Scene with custom game methods
 */
export interface PowerUpScene extends Phaser.Scene {
  applyCoffee(duration: number): void;
  scalePaddle(scale: number, duration: number): void;
  grantShield(charges: number): void;
  clearCurrentHourRow(): void;
  convertRandomBlocks(count: number, meetingType?: string): void;
  createExtraBall(x: number, y: number, velocityX: number, velocityY: number): void;
}

/**
 * Phaser file loader file object
 */
export interface LoaderFile {
  key: string;
  src: string;
  type: string;
}

/**
 * Type guard to check if a GameObject is a PhaserBall
 */
export function isPhaserBall(obj: unknown): obj is PhaserBall {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'body' in obj &&
    obj.body instanceof Phaser.Physics.Arcade.Body &&
    'active' in obj &&
    'visible' in obj
  );
}

/**
 * Type guard to check if a GameObject is a PhaserBlock
 */
export function isPhaserBlock(obj: unknown): obj is PhaserBlock {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'body' in obj &&
    obj.body instanceof Phaser.Physics.Arcade.Body &&
    'getData' in obj
  );
}

/**
 * Type guard to check if scene has PowerUp methods
 */
export function isPowerUpScene(scene: Phaser.Scene): scene is PowerUpScene {
  return (
    'applyCoffee' in scene &&
    'scalePaddle' in scene &&
    'grantShield' in scene &&
    'clearCurrentHourRow' in scene &&
    'convertRandomBlocks' in scene &&
    'createExtraBall' in scene
  );
}
