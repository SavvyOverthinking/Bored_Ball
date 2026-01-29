/**
 * Ball Pool System
 * Efficient ball management for split mechanics
 */

import Phaser from 'phaser';
import { PHYSICS, CANVAS } from '@config/constants';
import type { PhaserBall } from '@/types/game';

export class BallPool {
  private group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private pool: PhaserBall[] = [];
  private activeBallCount: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      collideWorldBounds: true,
      bounceX: 1,
      bounceY: 1,
    });
  }

  /**
   * Configure ball physics (shared between create and reuse)
   */
  private configureBall(ball: PhaserBall, x: number, y: number, vx: number, vy: number): void {
    ball.setPosition(x, y);
    ball.setActive(true).setVisible(true);
    ball.setDepth(100);

    const body = ball.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(PHYSICS.BALL_RADIUS);
      body.setCollideWorldBounds(true);
      body.setBounce(1, 1);
      body.setVelocity(vx, vy);
      body.onWorldBounds = true;

      // Prevent wobble: strict physics settings
      body.setMaxVelocity(PHYSICS.MAX_SPEED, PHYSICS.MAX_SPEED);
      body.setDamping(false);
      body.useDamping = false;
      body.allowGravity = false;
      body.setDrag(0);
      body.setFriction(0);

      // Force position sync every frame
      body.updateCenter();
    }
  }

  /**
   * Spawn a ball from the pool (reuses inactive balls when possible)
   */
  spawn(x: number, y: number, vx: number, vy: number): PhaserBall {
    // Check if we already have max balls (use cached count for performance)
    if (this.activeBallCount >= PHYSICS.MAX_BALLS) {
      console.log('Max balls reached, not spawning');
      // Return first active ball as fallback (maintains existing behavior)
      const firstActive = this.group.getFirstAlive() as PhaserBall;
      return firstActive;
    }

    // Try to reuse an inactive ball from the pool first
    let ball: PhaserBall | undefined = this.pool.pop();

    if (!ball) {
      // No inactive balls available, create a new one
      const newBall = this.scene.add.circle(x, y, PHYSICS.BALL_RADIUS, 0x2196f3);
      this.scene.physics.add.existing(newBall);
      this.group.add(newBall);
      ball = newBall as PhaserBall;
    }

    // Configure the ball (whether new or reused)
    this.configureBall(ball, x, y, vx, vy);
    this.activeBallCount++;

    return ball;
  }

  /**
   * Kill balls that are offscreen (returns them to pool for reuse)
   */
  killIfOffscreen(): void {
    const toDeactivate: PhaserBall[] = [];
    this.group.children.iterate((child) => {
      const ball = child as PhaserBall;
      if (ball.active && ball.y > CANVAS.HEIGHT + 30) {
        toDeactivate.push(ball);
      }
      return true;
    });

    // Deactivate offscreen balls and return to pool
    toDeactivate.forEach((ball) => {
      ball.setActive(false).setVisible(false);
      const body = ball.body as Phaser.Physics.Arcade.Body | null;
      if (body) {
        body.setVelocity(0, 0);
      }
      this.pool.push(ball);
      this.activeBallCount--;
    });
  }

  /**
   * Get all active balls
   */
  getActiveBalls(): PhaserBall[] {
    return this.group.getChildren().filter((child) => (child as PhaserBall).active) as PhaserBall[];
  }

  /**
   * Get the physics group
   */
  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  /**
   * Clear all balls (reset pool and count)
   */
  clear(): void {
    this.group.clear(true, true);
    this.pool = [];
    this.activeBallCount = 0;
  }

  /**
   * Get count of active balls (O(1) using cached count)
   */
  getActiveBallCount(): number {
    return this.activeBallCount;
  }
}

