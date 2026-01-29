import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComboManager,
  getComboTier,
  calculateMultiplier,
  formatComboText,
  getComboColor,
  COMBO_TIERS,
  ON_FIRE_THRESHOLD,
  ON_FIRE_BONUS
} from '../comboSystem';

describe('comboSystem', () => {
  describe('getComboTier()', () => {
    it('returns Base tier for 0-4 hits', () => {
      expect(getComboTier(0).name).toBe('Base');
      expect(getComboTier(1).name).toBe('Base');
      expect(getComboTier(4).name).toBe('Base');
    });

    it('returns Bronze tier for 5-9 hits', () => {
      expect(getComboTier(5).name).toBe('Bronze');
      expect(getComboTier(9).name).toBe('Bronze');
    });

    it('returns Silver tier for 10-19 hits', () => {
      expect(getComboTier(10).name).toBe('Silver');
      expect(getComboTier(19).name).toBe('Silver');
    });

    it('returns Gold tier for 20-34 hits', () => {
      expect(getComboTier(20).name).toBe('Gold');
      expect(getComboTier(34).name).toBe('Gold');
    });

    it('returns Platinum tier for 35-49 hits', () => {
      expect(getComboTier(35).name).toBe('Platinum');
      expect(getComboTier(49).name).toBe('Platinum');
    });

    it('returns Diamond tier for 50+ hits', () => {
      expect(getComboTier(50).name).toBe('Diamond');
      expect(getComboTier(100).name).toBe('Diamond');
    });
  });

  describe('calculateMultiplier()', () => {
    it('returns tier multiplier without On Fire', () => {
      expect(calculateMultiplier(1, false)).toBe(1.0);
      expect(calculateMultiplier(5, false)).toBe(1.5);
      expect(calculateMultiplier(10, false)).toBe(2.0);
      expect(calculateMultiplier(20, false)).toBe(3.0);
      expect(calculateMultiplier(35, false)).toBe(4.0);
      expect(calculateMultiplier(50, false)).toBe(5.0);
    });

    it('applies On Fire bonus when active', () => {
      const goldMultiplier = 3.0;
      const expectedWithFire = goldMultiplier * (1 + ON_FIRE_BONUS);
      expect(calculateMultiplier(20, true)).toBeCloseTo(expectedWithFire);
    });
  });

  describe('ComboManager', () => {
    let manager: ComboManager;

    beforeEach(() => {
      manager = new ComboManager();
    });

    it('starts with 0 hits', () => {
      expect(manager.getHits()).toBe(0);
      expect(manager.getMultiplier()).toBe(1.0);
    });

    it('increments hits on hit()', () => {
      manager.hit();
      expect(manager.getHits()).toBe(1);

      manager.hit();
      expect(manager.getHits()).toBe(2);
    });

    it('resets to 0 on reset()', () => {
      manager.hit();
      manager.hit();
      manager.hit();
      expect(manager.getHits()).toBe(3);

      manager.reset();
      expect(manager.getHits()).toBe(0);
      expect(manager.getMultiplier()).toBe(1.0);
    });

    it('activates On Fire at threshold', () => {
      // Hit until just before threshold
      for (let i = 0; i < ON_FIRE_THRESHOLD - 1; i++) {
        manager.hit();
      }
      expect(manager.getIsOnFire()).toBe(false);

      // One more hit should trigger On Fire
      manager.hit();
      expect(manager.getIsOnFire()).toBe(true);
    });

    it('reports didJustReachOnFire correctly', () => {
      // Hit until threshold
      for (let i = 0; i < ON_FIRE_THRESHOLD; i++) {
        manager.hit();
      }

      expect(manager.didJustReachOnFire()).toBe(true);
      expect(manager.didJustReachOnFire()).toBe(false); // Should be false on second call
    });

    it('returns correct state object', () => {
      for (let i = 0; i < 10; i++) {
        manager.hit();
      }

      const state = manager.getState();
      expect(state.hits).toBe(10);
      expect(state.tier.name).toBe('Silver');
      expect(state.multiplier).toBe(2.0);
      expect(state.isOnFire).toBe(false);
    });

    it('resets On Fire on reset()', () => {
      for (let i = 0; i < ON_FIRE_THRESHOLD; i++) {
        manager.hit();
      }
      expect(manager.getIsOnFire()).toBe(true);

      manager.reset();
      expect(manager.getIsOnFire()).toBe(false);
    });
  });

  describe('formatComboText()', () => {
    it('returns empty string for 0 hits', () => {
      const state = {
        hits: 0,
        tier: COMBO_TIERS[0],
        multiplier: 1.0,
        isOnFire: false,
        onFireStartTime: null,
        onFireTimeRemaining: 0
      };
      expect(formatComboText(state)).toBe('');
    });

    it('formats base tier correctly', () => {
      const state = {
        hits: 3,
        tier: COMBO_TIERS[0],
        multiplier: 1.0,
        isOnFire: false,
        onFireStartTime: null,
        onFireTimeRemaining: 0
      };
      expect(formatComboText(state)).toBe('3 Hits');
    });

    it('includes tier name for higher tiers', () => {
      const state = {
        hits: 10,
        tier: COMBO_TIERS[2], // Silver
        multiplier: 2.0,
        isOnFire: false,
        onFireStartTime: null,
        onFireTimeRemaining: 0
      };
      expect(formatComboText(state)).toContain('Silver');
      expect(formatComboText(state)).toContain('2.0x');
    });

    it('includes fire emoji when On Fire', () => {
      const state = {
        hits: 25,
        tier: COMBO_TIERS[3], // Gold
        multiplier: 4.5,
        isOnFire: true,
        onFireStartTime: Date.now(),
        onFireTimeRemaining: 5000
      };
      expect(formatComboText(state)).toContain('🔥');
    });
  });

  describe('getComboColor()', () => {
    it('returns tier color when not On Fire', () => {
      const state = {
        hits: 10,
        tier: COMBO_TIERS[2], // Silver
        multiplier: 2.0,
        isOnFire: false,
        onFireStartTime: null,
        onFireTimeRemaining: 0
      };
      expect(getComboColor(state)).toBe(COMBO_TIERS[2].color);
    });

    it('returns fire color when On Fire', () => {
      const state = {
        hits: 25,
        tier: COMBO_TIERS[3],
        multiplier: 4.5,
        isOnFire: true,
        onFireStartTime: Date.now(),
        onFireTimeRemaining: 5000
      };
      expect(getComboColor(state)).toBe(0xff4500); // Orange-red
    });
  });
});
