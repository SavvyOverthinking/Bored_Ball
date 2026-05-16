import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { generateWeek, computeColumns, minutesToHourLabel, type Meeting } from '../calendarGeneratorPhase2';

// Mock console.log to suppress output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('calendarGeneratorPhase2', () => {
  describe('generateWeek()', () => {
    describe('Day 1 - Onboarding', () => {
      it('generates exactly 10 blocks (2 per day)', () => {
        const meetings = generateWeek(1);
        expect(meetings.length).toBe(10);
      });

      it('places blocks on all 5 days (Mon-Fri)', () => {
        const meetings = generateWeek(1);
        const days = new Set(meetings.map(m => m.day));
        expect(days.size).toBe(5);
        expect(Array.from(days).sort()).toEqual([0, 1, 2, 3, 4]);
      });

      it('uses only "personal" type (grey blocks)', () => {
        const meetings = generateWeek(1);
        meetings.forEach(m => {
          expect(m.type).toBe('personal');
        });
      });

      it('places blocks at top of calendar (early morning)', () => {
        const meetings = generateWeek(1);
        // All blocks should start in the top area (9 AM - 11 AM = 0-120 minutes)
        meetings.forEach(m => {
          expect(m.startMin).toBeLessThanOrEqual(120);
        });
      });
    });

    describe('Days 2-5 - Teaching progression', () => {
      it('generates a readable early board for day 2', () => {
        const meetings = generateWeek(2);
        expect(meetings.length).toBe(10);
        expect(meetings.some(m => m.type === '1:1')).toBe(true);
        expect(meetings.some(m => m.type === 'team')).toBe(false);
      });

      it('introduces lunch on day 3 and team meetings on day 4', () => {
        const day3 = generateWeek(3);
        const day4 = generateWeek(4);

        expect(day3.some(m => m.type === 'lunch')).toBe(true);
        expect(day3.some(m => m.type === 'team')).toBe(false);
        expect(day4.some(m => m.type === 'team')).toBe(true);
      });
    });

    describe('Days 6-25 - Campaign ramp', () => {
      it('increases meeting count progressively', () => {
        const day5 = generateWeek(5);
        const day10 = generateWeek(10);
        const day25 = generateWeek(25);

        expect(day10.length).toBeGreaterThan(day5.length);
        expect(day25.length).toBeGreaterThan(day10.length);
        expect(day25.length).toBeLessThanOrEqual(40);
      });

      it('starts including boss meetings after day 6', () => {
        const meetings = generateWeek(6);
        const hasBoss = meetings.some(m => m.type === 'boss');
        expect(hasBoss).toBe(true);
      });

      it('introduces late-game meeting types before the finale', () => {
        expect(generateWeek(13).some(m => m.type === 'recurring')).toBe(true);
        expect(generateWeek(18).some(m => m.type === 'allhands')).toBe(true);
        expect(generateWeek(21).some(m => m.type === 'emergency')).toBe(true);
      });

      it('is deterministic (same day = same calendar)', () => {
        const first = generateWeek(20);
        const second = generateWeek(20);

        expect(first.length).toBe(second.length);
        expect(first[0].day).toBe(second[0].day);
        expect(first[0].startMin).toBe(second[0].startMin);
        expect(first[0].type).toBe(second[0].type);
      });
    });

    describe('Meeting validity', () => {
      it('generates valid meetings with required properties', () => {
        const meetings = generateWeek(15);

        meetings.forEach(m => {
          expect(m.day).toBeGreaterThanOrEqual(0);
          expect(m.day).toBeLessThanOrEqual(4);
          expect(m.startMin).toBeGreaterThanOrEqual(0);
          expect(m.endMin).toBeGreaterThan(m.startMin);
          expect(m.endMin).toBeLessThanOrEqual(480); // 8 hours * 60 minutes
          expect(['1:1', 'team', 'boss', 'lunch', 'personal', 'sticky', 'recurring', 'allhands', 'focus', 'emergency', 'optional']).toContain(m.type);
        });
      });

      it('aligns meetings to 15-minute slots', () => {
        const meetings = generateWeek(25);

        meetings.forEach(m => {
          expect(m.startMin % 15).toBe(0);
        });
      });

      it('keeps lunch meetings between 11:30 AM and 2:00 PM', () => {
        [3, 10, 20, 25].forEach(day => {
          const lunches = generateWeek(day).filter(m => m.type === 'lunch');

          lunches.forEach(lunch => {
            expect(lunch.startMin).toBeGreaterThanOrEqual(150);
            expect(lunch.endMin).toBeLessThanOrEqual(300);
          });
        });
      });

      it('limits lunch meetings to one per workday', () => {
        for (let campaignDay = 1; campaignDay <= 25; campaignDay++) {
          const lunchCountsByDay = new Map<number, number>();
          generateWeek(campaignDay)
            .filter(m => m.type === 'lunch')
            .forEach(lunch => {
              lunchCountsByDay.set(lunch.day, (lunchCountsByDay.get(lunch.day) || 0) + 1);
            });

          lunchCountsByDay.forEach(count => {
            expect(count).toBeLessThanOrEqual(1);
          });
        }
      });
    });
  });

  describe('computeColumns()', () => {
    it('assigns single column when no overlaps', () => {
      const meetings: Meeting[] = [
        { day: 0, startMin: 0, endMin: 60, type: '1:1' },
        { day: 0, startMin: 120, endMin: 180, type: 'team' },
        { day: 1, startMin: 0, endMin: 60, type: 'lunch' }
      ];

      const items = computeColumns(meetings);

      items.forEach(item => {
        expect(item.col).toBe(0);
        expect(item.cols).toBe(1);
      });
    });

    it('assigns multiple columns for overlapping meetings', () => {
      const meetings: Meeting[] = [
        { day: 0, startMin: 0, endMin: 60, type: '1:1' },
        { day: 0, startMin: 30, endMin: 90, type: 'team' }, // Overlaps first
      ];

      const items = computeColumns(meetings);

      // Should have 2 columns
      const maxCols = Math.max(...items.map(i => i.cols));
      expect(maxCols).toBe(2);

      // Items should be in different columns
      const columns = items.map(i => i.col);
      expect(new Set(columns).size).toBe(2);
    });

    it('handles triple overlaps correctly', () => {
      const meetings: Meeting[] = [
        { day: 0, startMin: 0, endMin: 120, type: '1:1' },
        { day: 0, startMin: 30, endMin: 90, type: 'team' },
        { day: 0, startMin: 60, endMin: 150, type: 'boss' },
      ];

      const items = computeColumns(meetings);

      // All three overlap, should have 3 columns
      const allCols = items.filter(i => i.day === 0).map(i => i.cols);
      expect(Math.max(...allCols)).toBe(3);
    });

    it('preserves original meeting properties', () => {
      const meetings: Meeting[] = [
        { day: 2, startMin: 60, endMin: 120, type: 'boss', title: 'Test' }
      ];

      const items = computeColumns(meetings);

      expect(items[0].day).toBe(2);
      expect(items[0].startMin).toBe(60);
      expect(items[0].endMin).toBe(120);
      expect(items[0].type).toBe('boss');
      expect(items[0].title).toBe('Test');
    });

    it('handles empty input', () => {
      const items = computeColumns([]);
      expect(items).toEqual([]);
    });
  });

  describe('minutesToHourLabel()', () => {
    it('converts 0 minutes to 9 AM', () => {
      expect(minutesToHourLabel(0)).toBe('9 AM');
    });

    it('converts 180 minutes to 12 PM', () => {
      expect(minutesToHourLabel(180)).toBe('12 PM');
    });

    it('converts 240 minutes to 1 PM', () => {
      expect(minutesToHourLabel(240)).toBe('1 PM');
    });

    it('converts 480 minutes to 5 PM', () => {
      expect(minutesToHourLabel(480)).toBe('5 PM');
    });

    it('handles custom start hour', () => {
      expect(minutesToHourLabel(0, 8)).toBe('8 AM');
      expect(minutesToHourLabel(60, 8)).toBe('9 AM');
    });
  });
});
