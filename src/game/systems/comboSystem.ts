/**
 * Combo/Streak System
 * Rewards continuous skillful play without paddle resets
 */

export interface ComboTier {
  name: string;
  minHits: number;
  multiplier: number;
  color: number;
}

export const COMBO_TIERS: ComboTier[] = [
  { name: 'Base', minHits: 1, multiplier: 1.0, color: 0xffffff },
  { name: 'Bronze', minHits: 5, multiplier: 1.5, color: 0xcd7f32 },
  { name: 'Silver', minHits: 10, multiplier: 2.0, color: 0xc0c0c0 },
  { name: 'Gold', minHits: 20, multiplier: 3.0, color: 0xffd700 },
  { name: 'Platinum', minHits: 35, multiplier: 4.0, color: 0xe5e4e2 },
  { name: 'Diamond', minHits: 50, multiplier: 5.0, color: 0xb9f2ff },
];

export const ON_FIRE_THRESHOLD = 20;
export const ON_FIRE_DURATION = 10000; // 10 seconds
export const ON_FIRE_BONUS = 0.5; // +50% stacking bonus

export interface ComboState {
  hits: number;
  tier: ComboTier;
  multiplier: number;
  isOnFire: boolean;
  onFireStartTime: number | null;
  onFireTimeRemaining: number;
}

/**
 * Get the current combo tier based on hit count
 */
export function getComboTier(hits: number): ComboTier {
  let tier = COMBO_TIERS[0];
  for (const t of COMBO_TIERS) {
    if (hits >= t.minHits) {
      tier = t;
    }
  }
  return tier;
}

/**
 * Calculate the total multiplier including On Fire bonus
 */
export function calculateMultiplier(hits: number, isOnFire: boolean): number {
  const tier = getComboTier(hits);
  let multiplier = tier.multiplier;

  if (isOnFire) {
    multiplier *= (1 + ON_FIRE_BONUS);
  }

  return multiplier;
}

/**
 * ComboManager class for managing combo state
 */
export class ComboManager {
  private hits: number = 0;
  private isOnFire: boolean = false;
  private onFireStartTime: number | null = null;
  private justReachedOnFire: boolean = false;

  /**
   * Register a block hit - increases combo
   */
  hit(): ComboState {
    this.hits++;

    // Check if we just reached On Fire threshold
    if (this.hits >= ON_FIRE_THRESHOLD && !this.isOnFire) {
      this.isOnFire = true;
      this.onFireStartTime = Date.now();
      this.justReachedOnFire = true;
    }

    return this.getState();
  }

  /**
   * Ball hit paddle - resets combo
   */
  reset(): ComboState {
    this.hits = 0;
    this.isOnFire = false;
    this.onFireStartTime = null;
    this.justReachedOnFire = false;
    return this.getState();
  }

  /**
   * Update On Fire timer - call this in scene update
   */
  update(): ComboState {
    if (this.isOnFire && this.onFireStartTime) {
      const elapsed = Date.now() - this.onFireStartTime;
      if (elapsed >= ON_FIRE_DURATION) {
        this.isOnFire = false;
        this.onFireStartTime = null;
      }
    }
    return this.getState();
  }

  /**
   * Check if we just reached On Fire (for triggering effects)
   */
  didJustReachOnFire(): boolean {
    if (this.justReachedOnFire) {
      this.justReachedOnFire = false;
      return true;
    }
    return false;
  }

  /**
   * Get current combo state
   */
  getState(): ComboState {
    const tier = getComboTier(this.hits);
    const multiplier = calculateMultiplier(this.hits, this.isOnFire);

    let onFireTimeRemaining = 0;
    if (this.isOnFire && this.onFireStartTime) {
      onFireTimeRemaining = Math.max(0, ON_FIRE_DURATION - (Date.now() - this.onFireStartTime));
    }

    return {
      hits: this.hits,
      tier,
      multiplier,
      isOnFire: this.isOnFire,
      onFireStartTime: this.onFireStartTime,
      onFireTimeRemaining,
    };
  }

  /**
   * Get current hit count
   */
  getHits(): number {
    return this.hits;
  }

  /**
   * Get current multiplier
   */
  getMultiplier(): number {
    return calculateMultiplier(this.hits, this.isOnFire);
  }

  /**
   * Check if On Fire is active
   */
  getIsOnFire(): boolean {
    return this.isOnFire;
  }
}

/**
 * Format combo display text
 */
export function formatComboText(state: ComboState): string {
  if (state.hits === 0) return '';

  const tierText = state.tier.name !== 'Base' ? ` ${state.tier.name}` : '';
  const fireText = state.isOnFire ? ' 🔥' : '';
  const multiplierText = state.multiplier > 1 ? ` (${state.multiplier.toFixed(1)}x)` : '';

  return `${state.hits} Hit${state.hits > 1 ? 's' : ''}${tierText}${multiplierText}${fireText}`;
}

/**
 * Get color for combo display
 */
export function getComboColor(state: ComboState): number {
  if (state.isOnFire) {
    return 0xff4500; // Orange-red for On Fire
  }
  return state.tier.color;
}

export default ComboManager;
