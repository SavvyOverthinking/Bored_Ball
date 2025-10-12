/**
 * Ball Pool System
 * Efficient ball management for split mechanics
 */

import Phaser from 'phaser';
import { PHYSICS, CANVAS } from './constants';

export class BallPool {
  private group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      collideWorldBounds: true,
      bounceX: 1,
      bounceY: 1,
    });
  }

  /**
   * Spawn a ball from the pool
   */
  spawn(x: number, y: number, vx: number, vy: number): Phaser.GameObjects.Arc {
    // Check if we already have max balls
    const activeBalls = this.group.getChildren().filter((child: any) => child.active);
    if (activeBalls.length >= PHYSICS.MAX_BALLS) {
      console.log('Max balls reached, not spawning');
      return activeBalls[0] as Phaser.GameObjects.Arc;
    }

    // Get or create ball
    let ball = this.group.get(x, y) as Phaser.GameObjects.Arc;

    if (!ball) {
      // Create new ball if pool is empty
      ball = this.scene.add.circle(x, y, PHYSICS.BALL_RADIUS, 0x2196f3);
      this.scene.physics.add.existing(ball);
      this.group.add(ball);
    }

    // Configure ball
    ball.setActive(true).setVisible(true).setPosition(x, y);

    const body = ball.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(PHYSICS.BALL_RADIUS);
      body.setCollideWorldBounds(true);
      body.setBounce(1, 1);
      body.setVelocity(vx, vy);
      body.onWorldBounds = true;
    }

    ball.setDepth(100);

    return ball;
  }

  /**
   * Kill balls that are offscreen
   */
  killIfOffscreen(): void {
    this.group.children.iterate((child: any) => {
      if (child.active && child.y > CANVAS.HEIGHT + 30) {
        child.setActive(false).setVisible(false);
        if (child.body) {
          child.body.setVelocity(0, 0);
        }
      }
      return true;
    });
  }

  /**
   * Get all active balls
   */
  getActiveBalls(): Phaser.GameObjects.Arc[] {
    return this.group.getChildren().filter((child: any) => child.active) as Phaser.GameObjects.Arc[];
  }

  /**
   * Get the physics group
   */
  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  /**
   * Clear all balls
   */
  clear(): void {
    this.group.clear(true, true);
  }

  /**
   * Get count of active balls
   */
  getActiveCount(): number {
    return this.group.getChildren().filter((child: any) => child.active).length;
  }
}

