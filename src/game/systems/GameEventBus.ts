/**
 * GameEventBus - Event-driven communication bridge between React and Phaser
 *
 * This singleton event emitter allows Phaser scenes to emit state changes
 * and React components to subscribe to those changes without tight coupling.
 *
 * Usage:
 * - Phaser scenes: gameEventBus.emit('SCORE_UPDATE', { score: 100 })
 * - React components: gameEventBus.on('SCORE_UPDATE', ({ score }) => setState(score))
 */

import Phaser from 'phaser';

// Event type definitions for type safety
export interface GameEvents {
  SCORE_UPDATE: { score: number };
  LIVES_UPDATE: { lives: number };
  WEEK_UPDATE: { week: number };
  POWERUP_STATUS: { status: string | null; duration?: number };
  GAME_PAUSE: { isPaused: boolean };
  GAME_OVER: { gameOver: boolean; finalScore?: number };
  COMBO_UPDATE: { combo: number; multiplier: number };
  WEEK_CLEARED: { week: number; score: number };
}

export type GameEventType = keyof GameEvents;

/**
 * Singleton event bus for React-Phaser communication
 * Extends Phaser.Events.EventEmitter for compatibility with Phaser's event system
 */
class GameEventBus extends Phaser.Events.EventEmitter {
  private static instance: GameEventBus | null = null;

  private constructor() {
    super();
  }

  /**
   * Get the singleton instance of the event bus
   */
  static getInstance(): GameEventBus {
    if (!GameEventBus.instance) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }

  /**
   * Emit a typed game event
   */
  emitGameEvent<T extends GameEventType>(event: T, payload: GameEvents[T]): boolean {
    return this.emit(event, payload);
  }

  /**
   * Subscribe to a typed game event
   */
  onGameEvent<T extends GameEventType>(
    event: T,
    fn: (payload: GameEvents[T]) => void,
    context?: unknown
  ): this {
    return this.on(event, fn, context);
  }

  /**
   * Unsubscribe from a typed game event
   */
  offGameEvent<T extends GameEventType>(
    event: T,
    fn?: (payload: GameEvents[T]) => void,
    context?: unknown
  ): this {
    return this.off(event, fn, context);
  }

  /**
   * Subscribe to a typed game event (fires once)
   */
  onceGameEvent<T extends GameEventType>(
    event: T,
    fn: (payload: GameEvents[T]) => void,
    context?: unknown
  ): this {
    return this.once(event, fn, context);
  }

  /**
   * Reset the event bus (useful for testing or game restart)
   */
  reset(): void {
    this.removeAllListeners();
  }

  /**
   * Destroy the singleton instance (useful for cleanup)
   */
  static destroy(): void {
    if (GameEventBus.instance) {
      GameEventBus.instance.removeAllListeners();
      GameEventBus.instance = null;
    }
  }
}

// Export the singleton instance for easy access
export const gameEventBus = GameEventBus.getInstance();

// Export the class for type checking
export { GameEventBus };
