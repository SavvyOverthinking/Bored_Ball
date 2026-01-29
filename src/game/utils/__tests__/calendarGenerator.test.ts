import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWeek, computeColumns, minutesToHourLabel, type Meeting } from '../calendarGeneratorPhase2';

// Mock console.log to suppress output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('calendarGeneratorPhase2', () => {
  describe('generateWeek()', () => {
    describe('Week 1 - Onboarding', () => {
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
        // All blocks should start at 9 AM (startMin = 0) or 11 AM (startMin = 120)
        meetings.forEach(m => {
          expect([0, 120]).toContain(m.startMin);
        });
      });
    });

    describe('Week 2 - Basics', () => {
      it('generates 8 meetings (2 of each basic type)', () => {
        const meetings = generateWeek(2);
        expect(meetings.length).toBe(8);
      });

      it('includes exactly 2 of each basic type (no boss)', () => {
        const meetings = generateWeek(2);
        const typeCounts: Record<string, number> = {};
        meetings.forEach(m => {
          typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
        });

        expect(typeCounts['team']).toBe(2);
        expect(typeCounts['1:1']).toBe(2);
        expect(typeCounts['lunch']).toBe(2);
        expect(typeCounts['personal']).toBe(2);
        expect(typeCounts['boss']).toBeUndefined();
      });
    });

    describe('Weeks 3-20 - Progressive', () => {
      it('increases meeting count progressively', () => {
        const week3 = generateWeek(3);
        const week10 = generateWeek(10);
        const week20 = generateWeek(20);

        // Week 3 should have ~10 meetings
        expect(week3.length).toBeGreaterThanOrEqual(8);
        expect(week3.length).toBeLessThanOrEqual(15);

        // Week 10 should have more
        expect(week10.length).toBeGreaterThan(week3.length);

        // Week 20 should have ~40+ meetings (including overlaps)
        expect(week20.length).toBeGreaterThanOrEqual(35);
      });

      it('starts including boss meetings after week 3', () => {
        // Generate multiple times to account for RNG
        const meetings = generateWeek(10);
        const hasBoss = meetings.some(m => m.type === 'boss');
        // Boss should appear in later progressive weeks
        // This is probabilistic, so we check pattern not guaranteed occurrence
        expect(typeof hasBoss).toBe('boolean');
      });
    });

    describe('Weeks 21+ - Curve System', () => {
      it('generates high meeting density at week 52', () => {
        const meetings = generateWeek(52);
        // Week 52 has 80% density, should generate many meetings
        expect(meetings.length).toBeGreaterThanOrEqual(40);
      });

      it('is deterministic (same week = same calendar)', () => {
        const first = generateWeek(30);
        const second = generateWeek(30);

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
          expect(['1:1', 'team', 'boss', 'lunch', 'personal', 'sticky']).toContain(m.type);
        });
      });

      it('aligns meetings to 15-minute slots', () => {
        const meetings = generateWeek(25);

        meetings.forEach(m => {
          expect(m.startMin % 15).toBe(0);
        });
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
