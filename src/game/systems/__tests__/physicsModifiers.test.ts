import { describe, it, expect, vi } from 'vitest';

// Mock Phaser before importing modules that depend on it
vi.mock('phaser', () => ({
  default: {
    Math: {
      Between: (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
    },
    Events: {
      EventEmitter: class {}
    },
    Physics: {
      Arcade: {
        Body: class {}
      }
    }
  }
}));

import {
  PHYSICS_EFFECTS,
  applyMeetingEffect,
  type MeetingType
} from '../physicsModifiers';
import type { PhaserBall } from '@/types/game';

// Mock Phaser.Scene
const createMockScene = () => ({
  time: {
    delayedCall: vi.fn((_delay: number, callback: () => void) => {
      // Immediately execute callback for testing
      callback();
      return { remove: vi.fn() };
    })
  }
});

// Mock PhaserBall with controllable physics body
const createMockBall = (vx = 300, vy = -300): PhaserBall => {
  const body = {
    velocity: { x: vx, y: vy },
    setVelocity: vi.fn((newVx: number, newVy: number) => {
      body.velocity.x = newVx;
      body.velocity.y = newVy;
    }),
    setImmovable: vi.fn(),
    setCollideWorldBounds: vi.fn()
  };

  return {
    body,
    x: 400,
    y: 300,
    active: true,
    visible: true
  } as unknown as PhaserBall;
};

describe('physicsModifiers', () => {
  describe('PHYSICS_EFFECTS', () => {
    it('defines all expected meeting types', () => {
      const expectedTypes: MeetingType[] = ['1:1', 'team', 'boss', 'lunch', 'personal', 'sticky'];
      expectedTypes.forEach(type => {
        expect(PHYSICS_EFFECTS[type]).toBeDefined();
        expect(PHYSICS_EFFECTS[type].type).toBe(type);
      });
    });

    it('each effect has required properties', () => {
      Object.values(PHYSICS_EFFECTS).forEach(effect => {
        expect(effect.type).toBeDefined();
        expect(effect.description).toBeDefined();
        expect(effect.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(typeof effect.apply).toBe('function');
      });
    });
  });

  describe('1:1 effect (+10% speed)', () => {
    it('increases ball speed by 10%', () => {
      const ball = createMockBall(300, -300);
      const scene = createMockScene();
      const body = ball.body!;

      PHYSICS_EFFECTS['1:1'].apply(ball, scene as never);

      // Speed should be multiplied by 1.1
      expect(body.setVelocity).toHaveBeenCalled();
      const [newVx, newVy] = (body.setVelocity as ReturnType<typeof vi.fn>).mock.calls[0];
      const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
      const expectedSpeed = 300 * 1.1; // BASE_SPEED * 1.1
      expect(newSpeed).toBeCloseTo(expectedSpeed, 0);
    });

    it('handles zero velocity gracefully', () => {
      const ball = createMockBall(0, 0);
      const scene = createMockScene();

      // Should not throw
      expect(() => {
        PHYSICS_EFFECTS['1:1'].apply(ball, scene as never);
      }).not.toThrow();
    });

    it('handles null body gracefully', () => {
      const ball = { ...createMockBall(), body: null };
      const scene = createMockScene();

      expect(() => {
        PHYSICS_EFFECTS['1:1'].apply(ball as PhaserBall, scene as never);
      }).not.toThrow();
    });
  });

  describe('boss effect (Speed x1.8)', () => {
    it('dramatically increases ball speed', () => {
      const ball = createMockBall(300, -300);
      const scene = createMockScene();
      const body = ball.body!;

      PHYSICS_EFFECTS['boss'].apply(ball, scene as never);

      expect(body.setVelocity).toHaveBeenCalled();
      const [newVx, newVy] = (body.setVelocity as ReturnType<typeof vi.fn>).mock.calls[0];
      const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
      const expectedSpeed = 300 * 1.8; // BASE_SPEED * 1.8
      expect(newSpeed).toBeCloseTo(expectedSpeed, 0);
    });
  });

  describe('lunch effect (Normalize speed)', () => {
    it('normalizes ball speed to base', () => {
      // Start with very fast ball
      const ball = createMockBall(500, -500);
      const scene = createMockScene();
      const body = ball.body!;

      PHYSICS_EFFECTS['lunch'].apply(ball, scene as never);

      expect(body.setVelocity).toHaveBeenCalled();
      const [newVx, newVy] = (body.setVelocity as ReturnType<typeof vi.fn>).mock.calls[0];
      const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
      expect(newSpeed).toBeCloseTo(300, 0); // BASE_SPEED
    });

    it('maintains direction when normalizing', () => {
      const ball = createMockBall(400, -200);
      const scene = createMockScene();
      const body = ball.body!;

      const originalAngle = Math.atan2(-200, 400);
      PHYSICS_EFFECTS['lunch'].apply(ball, scene as never);

      const [newVx, newVy] = (body.setVelocity as ReturnType<typeof vi.fn>).mock.calls[0];
      const newAngle = Math.atan2(newVy, newVx);
      expect(newAngle).toBeCloseTo(originalAngle, 2);
    });
  });

  describe('personal effect (Reset bounce)', () => {
    it('resets ball to base speed while maintaining angle', () => {
      const ball = createMockBall(200, -400);
      const scene = createMockScene();
      const body = ball.body!;

      const originalAngle = Math.atan2(-400, 200);
      PHYSICS_EFFECTS['personal'].apply(ball, scene as never);

      expect(body.setVelocity).toHaveBeenCalled();
      const [newVx, newVy] = (body.setVelocity as ReturnType<typeof vi.fn>).mock.calls[0];

      // Check speed is BASE_SPEED
      const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
      expect(newSpeed).toBeCloseTo(300, 0);

      // Check angle is preserved
      const newAngle = Math.atan2(newVy, newVx);
      expect(newAngle).toBeCloseTo(originalAngle, 2);
    });
  });

  describe('sticky effect (Ball sticks)', () => {
    it('stops the ball temporarily', () => {
      const ball = createMockBall(300, -300);
      const scene = createMockScene();
      const body = ball.body!;

      PHYSICS_EFFECTS['sticky'].apply(ball, scene as never);

      // Ball should be stopped first
      expect(body.setVelocity).toHaveBeenCalledWith(0, 0);
      expect(body.setImmovable).toHaveBeenCalledWith(true);
    });

    it('restores movement after delay', () => {
      const ball = createMockBall(300, -300);
      const scene = createMockScene();
      const body = ball.body!;

      PHYSICS_EFFECTS['sticky'].apply(ball, scene as never);

      // After mock delay callback executes, ball should be movable again
      expect(body.setImmovable).toHaveBeenCalledWith(false);
      expect(body.setCollideWorldBounds).toHaveBeenCalledWith(true);
    });
  });

  describe('team effect (Split ball)', () => {
    it('attempts to create extra balls', () => {
      const ball = createMockBall(300, -300);
      const createExtraBall = vi.fn();
      const scene = {
        ...createMockScene(),
        createExtraBall
      };

      PHYSICS_EFFECTS['team'].apply(ball, scene as never);

      // Should create 2 extra balls with different angles
      expect(createExtraBall).toHaveBeenCalledTimes(2);
    });

    it('does nothing if scene lacks createExtraBall', () => {
      const ball = createMockBall(300, -300);
      const scene = createMockScene();

      // Should not throw
      expect(() => {
        PHYSICS_EFFECTS['team'].apply(ball, scene as never);
      }).not.toThrow();
    });
  });

  describe('applyMeetingEffect()', () => {
    it('applies correct effect for each meeting type', () => {
      const types: MeetingType[] = ['1:1', 'boss', 'lunch', 'personal'];

      types.forEach(type => {
        const ball = createMockBall();
        const scene = createMockScene();

        // Should not throw
        expect(() => {
          applyMeetingEffect(type, ball, scene as never);
        }).not.toThrow();
      });
    });

    it('handles unknown meeting type gracefully', () => {
      const ball = createMockBall();
      const scene = createMockScene();

      // Cast to bypass TypeScript for edge case testing
      expect(() => {
        applyMeetingEffect('unknown' as MeetingType, ball, scene as never);
      }).not.toThrow();
    });
  });
});
