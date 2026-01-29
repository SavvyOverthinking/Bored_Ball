// Game Scenes
export * from './scenes/BaseCalendarScene';
export * from './scenes/MainScene';
export * from './scenes/MainScenePhase2';
export * from './scenes/WeekendStageScene';

// Game Objects
export * from './objects/BallPool';
export * from './objects/powerups';

// Game Systems
export * from './systems/GameEventBus';
export * from './systems/physicsModifiers';
export * from './systems/soundEffects';

// Game Utilities
// Note: calendarGenerator and calendarGeneratorPhase2 both export 'Meeting'
// Re-export selectively to avoid conflicts
export {
  generateCalendarBlocks,
  getCalendarGridConfig,
  getBoardDimensions,
  type Meeting as Phase1Meeting,
  type BlockData,
} from './utils/calendarGenerator';

export {
  generateWeek,
  computeColumns,
  minutesToHourLabel,
  type Meeting,
  type RenderItem,
} from './utils/calendarGeneratorPhase2';

export * from './utils/index'; // Original utils.ts, now index.ts
export * from './utils/levelCurve';
export * from './utils/phase2Router';
export * from './utils/rng';
