import { describe, it, expect } from 'vitest';
import { curve, describeDifficulty, estimatedMinutes, type LevelTuning } from '../levelCurve';

describe('levelCurve', () => {
  describe('curve()', () => {
    it('clamps day to valid campaign range (1-25)', () => {
      expect(curve(0).week).toBe(1);
      expect(curve(100).week).toBe(25);
    });

    it('ramps from onboarding to final Friday without overpacking boards', () => {
      const day1 = curve(1);
      const day10 = curve(10);
      const day25 = curve(25);

      expect(day1.density).toBeCloseTo(0.22, 2);
      expect(day10.density).toBeCloseTo(0.44, 2);
      expect(day25.density).toBeCloseTo(0.68, 2);

      expect(day1.paddleScale).toBe(1.45);
      expect(day10.paddleScale).toBeCloseTo(1.11, 2);
      expect(day25.paddleScale).toBe(0.92);

      expect(day1.baseSpeed).toBe(200);
      expect(day10.baseSpeed).toBe(248);
      expect(day25.baseSpeed).toBe(295);
    });

    it('introduces more balls and smaller blocks late in the campaign', () => {
      expect(curve(1).ballMaxCount).toBe(2);
      expect(curve(10).ballMaxCount).toBe(3);
      expect(curve(21).ballMaxCount).toBe(4);

      expect(curve(5).minBlockMins).toBe(60);
      expect(curve(11).minBlockMins).toBe(30);
      expect(curve(25).minBlockMins).toBe(15);
    });

    it('returns all expected LevelTuning properties', () => {
      const tuning = curve(15);
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

    it('maintains sensible value ranges across the 25-day campaign', () => {
      for (let day = 1; day <= 25; day++) {
        const t = curve(day);

        expect(t.density).toBeGreaterThanOrEqual(0.20);
        expect(t.density).toBeLessThanOrEqual(0.70);
        expect(t.bossRate).toBeGreaterThanOrEqual(0);
        expect(t.bossRate).toBeLessThanOrEqual(0.15);
        expect(t.paddleScale).toBeGreaterThanOrEqual(0.9);
        expect(t.paddleScale).toBeLessThanOrEqual(1.45);
        expect(t.baseSpeed).toBeGreaterThanOrEqual(200);
        expect(t.baseSpeed).toBeLessThanOrEqual(295);
        expect(t.ballMaxCount).toBeGreaterThanOrEqual(2);
        expect(t.ballMaxCount).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('describeDifficulty()', () => {
    it('returns five work-week labels', () => {
      expect(describeDifficulty(1)).toBe('Week 1 - Onboarding');
      expect(describeDifficulty(6)).toBe('Week 2 - Team Ramp');
      expect(describeDifficulty(11)).toBe('Week 3 - Meeting Creep');
      expect(describeDifficulty(16)).toBe('Week 4 - Calendar Crunch');
      expect(describeDifficulty(25)).toBe('Week 5 - Final Friday');
    });
  });

  describe('estimatedMinutes()', () => {
    it('keeps early days short and finale longer', () => {
      expect(estimatedMinutes(1)).toBe(3);
      expect(estimatedMinutes(10)).toBe(4);
      expect(estimatedMinutes(25)).toBe(7);
      expect(estimatedMinutes(25)).toBeGreaterThan(estimatedMinutes(10));
    });
  });
});
