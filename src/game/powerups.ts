/**
 * Power-up System - Phase 2
 * Weekly power-ups that provide temporary advantages
 * Maximum ONE power-up per week
 */

export type PowerUpKind = 'coffee' | 'happyHour' | 'dnd' | 'reschedule' | 'cleanup';

export interface PowerUpDefinition {
  id: PowerUpKind;
  icon: string;           // Texture key for icon
  label: string;          // Display name
  description: string;    // Tooltip/help text
  color: number;          // Tint color
  apply: (scene: any) => void;  // Effect function
}

/**
 * Power-up definitions
 */
export const POWERUPS: Record<PowerUpKind, PowerUpDefinition> = {
  coffee: {
    id: 'coffee',
    icon: 'pu_coffee',
    label: '☕ Coffee Break',
    description: 'Stabilize ball speed for 15 seconds',
    color: 0x8B4513,
    apply: (scene) => scene.applyCoffee(15000)
  },
  
  happyHour: {
    id: 'happyHour',
    icon: 'pu_happy',
    label: '🍻 Happy Hour',
    description: 'Wider paddle for 30 seconds',
    color: 0xFFD700,
    apply: (scene) => scene.scalePaddle(1.4, 30000)
  },
  
  dnd: {
    id: 'dnd',
    icon: 'pu_shield',
    label: '🛡️ Do Not Disturb',
    description: 'Shield: survive 1 ball drain',
    color: 0x4169E1,
    apply: (scene) => scene.grantShield(1)
  },
  
  reschedule: {
    id: 'reschedule',
    icon: 'pu_row',
    label: '📅 Reschedule Meeting',
    description: 'Clear one entire hour row',
    color: 0xFF6600,
    apply: (scene) => scene.clearCurrentHourRow()
  },
  
  cleanup: {
    id: 'cleanup',
    icon: 'pu_broom',
    label: '🧹 Calendar Cleanup',
    description: 'Convert 3 random meetings to lunch breaks',
    color: 0x32CD32,
    apply: (scene) => scene.convertRandomBlocks(3, 'lunch')
  }
};

/**
 * Get all power-up types as array
 */
export const getAllPowerUps = (): PowerUpDefinition[] => {
  return Object.values(POWERUPS);
};

/**
 * Get a random power-up (excluding specific types if needed)
 */
export const getRandomPowerUp = (exclude: PowerUpKind[] = []): PowerUpDefinition => {
  const available = getAllPowerUps().filter(pu => !exclude.includes(pu.id));
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
};

/**
 * Power-up spawn configuration
 */
export const POWERUP_CONFIG = {
  // Timing
  MIN_SPAWN_DELAY: 8000,   // 8 seconds after week start
  MAX_SPAWN_DELAY: 16000,  // 16 seconds after week start
  
  // Visual
  FLOAT_AMPLITUDE: 8,      // Pixels up/down
  FLOAT_SPEED: 2000,       // ms per cycle
  ICON_SCALE: 0.6,         // Size relative to block
  GLOW_ALPHA: 0.4,         // Glow effect opacity
  
  // Behavior
  MAX_PER_WEEK: 1,         // Exactly one per week
  AVOID_BOSS_BLOCKS: true, // Don't spawn on boss meetings
  PICKUP_RADIUS: 30        // Collision detection radius
};

/**
 * Power-up effect durations (in milliseconds)
 */
export const DURATIONS = {
  COFFEE: 15000,      // 15 seconds
  HAPPY_HOUR: 30000,  // 30 seconds
  SHIELD: Infinity,   // Until used
  RESCHEDULE: 0,      // Instant
  CLEANUP: 0          // Instant
};

/**
 * Visual effect colors for power-up particle systems
 */
export const PARTICLE_COLORS = {
  coffee: [0x8B4513, 0xD2691E, 0xFFE4C4],
  happyHour: [0xFFD700, 0xFFA500, 0xFF8C00],
  dnd: [0x4169E1, 0x1E90FF, 0x87CEEB],
  reschedule: [0xFF6600, 0xFF8C00, 0xFFA500],
  cleanup: [0x32CD32, 0x90EE90, 0x00FF00]
};

export default POWERUPS;

