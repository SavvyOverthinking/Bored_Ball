import { describe, it, expect } from 'vitest';
import { curve, describeDifficulty, estimatedMinutes, type LevelTuning } from '../levelCurve';

describe('levelCurve', () => {
  describe('curve()', () => {
    it('clamps week to valid range (1-52)', () => {
      const tooLow = curve(0);
      expect(tooLow.week).toBe(1);

      const tooHigh = curve(100);
      expect(tooHigh.week).toBe(52);
    });

    it('returns static tuning for weeks 1-20', () => {
      const week1 = curve(1);
      const week10 = curve(10);
      const week20 = curve(20);

      // All early weeks should have same base values
      expect(week1.density).toBe(0.35);
      expect(week10.density).toBe(0.35);
      expect(week20.density).toBe(0.35);

      expect(week1.paddleScale).toBe(1.2);
      expect(week1.baseSpeed).toBe(220);
      expect(week1.ballMaxCount).toBe(2);
    });

    it('progressively increases difficulty from week 21 to 52', () => {
      const week21 = curve(21);
      const week36 = curve(36);
      const week52 = curve(52);

      // Density increases
      expect(week21.density).toBeCloseTo(0.35 + 0.45 * (1 / 32), 2);
      expect(week52.density).toBeCloseTo(0.80, 2);
      expect(week36.density).toBeGreaterThan(week21.density);
      expect(week52.density).toBeGreaterThan(week36.density);

      // Boss rate increases
      expect(week52.bossRate).toBeCloseTo(0.14, 2);
      expect(week52.bossRate).toBeGreaterThan(week21.bossRate);

      // Paddle scale decreases (harder)
      expect(week52.paddleScale).toBeCloseTo(0.85, 2);
      expect(week52.paddleScale).toBeLessThan(week21.paddleScale);

      // Ball speed increases
      expect(week52.baseSpeed).toBe(300);
      expect(week52.baseSpeed).toBeGreaterThan(week21.baseSpeed);

      // Ball max count increases
      expect(week52.ballMaxCount).toBe(4);
      expect(week52.ballMaxCount).toBeGreaterThan(week21.ballMaxCount);

      // Lunch rate decreases (less relief)
      expect(week52.lunchRate).toBeCloseTo(0.10, 2);
      expect(week52.lunchRate).toBeLessThan(week21.lunchRate);

      // Min block minutes decrease (smaller targets)
      expect(week52.minBlockMins).toBe(15);
      expect(week52.minBlockMins).toBeLessThan(week21.minBlockMins);
    });

    it('returns all expected LevelTuning properties', () => {
      const tuning = curve(30);
      const expectedKeys: (keyof LevelTuning)[] = [
        'week',
        'density',
        'bossRate',
        'teamRate',
        'lunchRate',
        'minBlockMins',
        'ballMaxCount',
        'paddleScale',
        'baseSpeed'
      ];

      expectedKeys.forEach(key => {
        expect(tuning).toHaveProperty(key);
        expect(typeof tuning[key]).toBe('number');
      });
    });

    it('maintains sensible value ranges for all weeks', () => {
      for (let week = 1; week <= 52; week++) {
        const t = curve(week);

        expect(t.density).toBeGreaterThanOrEqual(0.35);
        expect(t.density).toBeLessThanOrEqual(0.80);

        expect(t.bossRate).toBeGreaterThanOrEqual(0.04);
        expect(t.bossRate).toBeLessThanOrEqual(0.14);

        expect(t.paddleScale).toBeGreaterThanOrEqual(0.85);
        expect(t.paddleScale).toBeLessThanOrEqual(1.2);

        expect(t.baseSpeed).toBeGreaterThanOrEqual(220);
        expect(t.baseSpeed).toBeLessThanOrEqual(300);

        expect(t.ballMaxCount).toBeGreaterThanOrEqual(2);
        expect(t.ballMaxCount).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('describeDifficulty()', () => {
    it('returns appropriate difficulty labels for each phase', () => {
      expect(describeDifficulty(1)).toBe('Onboarding Week - Easy Mode');
      expect(describeDifficulty(2)).toBe('Onboarding Week - Easy Mode');
      expect(describeDifficulty(5)).toBe('Early Career - Learning');
      expect(describeDifficulty(10)).toBe('Early Career - Learning');
      expect(describeDifficulty(15)).toBe('Progressive Ramp - Manageable');
      expect(describeDifficulty(20)).toBe('Progressive Ramp - Manageable');
      expect(describeDifficulty(25)).toBe('Mid-Year Crunch - Challenging');
      expect(describeDifficulty(35)).toBe('Mid-Year Crunch - Challenging');
      expect(describeDifficulty(40)).toBe('Year-End Chaos - Hard');
      expect(describeDifficulty(45)).toBe('Year-End Chaos - Hard');
      expect(describeDifficulty(50)).toBe('Burnout Season - Brutal');
      expect(describeDifficulty(52)).toBe('Burnout Season - Brutal');
    });
  });

  describe('estimatedMinutes()', () => {
    it('returns reasonable estimates based on density', () => {
      const week10 = estimatedMinutes(10);
      const week52 = estimatedMinutes(52);

      // Week 10: 0.35 * 10 = 3.5 minutes (no late-game bonus)
      expect(week10).toBe(4);

      // Week 52: 0.80 * 10 + 3 = 11 minutes (with late-game bonus)
      expect(week52).toBe(11);

      // Later weeks should take longer
      expect(week52).toBeGreaterThan(week10);
    });

    it('adds bonus time for weeks past 30', () => {
      const week30 = estimatedMinutes(30);
      const week31 = estimatedMinutes(31);

      // Week 31+ gets +3 minutes
      expect(week31 - week30).toBeGreaterThanOrEqual(2);
    });
  });
});
