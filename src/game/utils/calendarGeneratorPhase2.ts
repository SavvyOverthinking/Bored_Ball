/**
 * Phase 2 Calendar Generator
 * CLASSIC ARCADE PROGRESSION:
 * - Weeks 1-3: Easy (top of screen, few blocks)
 * - Weeks 4-7: Medium (top half, more blocks)
 * - Weeks 8-10: Hard (3/4 screen, many blocks)
 * - Weeks 11+: Full difficulty (plateau)
 */

import { mulberry32 } from '@game/utils/rng';
import { type MeetingType, canAppearInWeek } from '@game/systems/physicsModifiers';
import { curve } from '@game/utils/levelCurve';

// Title templates for all meeting types
const MEETING_TITLES: Record<MeetingType, string[]> = {
  'boss': ['1:1 with Manager', 'Exec Review', 'Performance Review', 'Strategy Sync'],
  'team': ['Team Standup', 'Sprint Planning', 'Team Sync', 'Retro'],
  '1:1': ['1:1 Sync', 'Weekly Check-in', 'Project Update', 'Coffee Chat'],
  'lunch': ['Lunch Break', 'Team Lunch', 'Lunch & Learn'],
  'personal': ['Focus Time', 'Personal', 'Deep Work', 'OOO'],
  'sticky': ['Sticky Note', 'Important Reminder', 'Long Discussion'],
  'recurring': ['Recurring Standup', 'Weekly Sync', 'Daily Check-in', 'Sprint Review'],
  'allhands': ['All-Hands Meeting', 'Company Update', 'Town Hall', 'Quarterly Review'],
  'focus': ['Focus Time', 'Deep Work', 'No Meetings', 'Heads Down'],
  'emergency': ['URGENT: Issue', 'Emergency Standup', 'Incident Review', 'Fire Drill'],
  'optional': ['Optional Sync', 'FYI Meeting', 'Drop-in Q&A', 'Office Hours']
};

export interface Meeting {
  day: number;              // 0..4 (Mon-Fri)
  startMin: number;         // minutes from start hour (9 AM = 0)
  endMin: number;           // startMin + duration
  type: MeetingType;
  title?: string;
}

export interface RenderItem extends Meeting {
  col: number;              // column index for double-booking layout
  cols: number;             // total columns in this overlap group
}

const START_HOUR = 9;
const END_HOUR = 17;
const DAY_MINS = (END_HOUR - START_HOUR) * 60; // 480 minutes

const INTRO_WEEK: Record<MeetingType, number> = {
  personal: 1,
  lunch: 1,
  '1:1': 2,
  team: 3,
  boss: 5,
  sticky: 7,
  focus: 10,
  optional: 10,
  recurring: 14,
  allhands: 20,
  emergency: 26,
};

interface ProgressionConfig {
  maxStartMin: number;
  meetingCount: number;
  minDuration: number;
  overlapRate: number;
  weights: Partial<Record<MeetingType, number>>;
  maxPerType: Partial<Record<MeetingType, number>>;
}

function roundToSlot(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function getMeetingCount(week: number): number {
  if (week === 1) return 10;
  if (week === 2) return 12;
  if (week === 3) return 15;
  if (week <= 5) return 15 + (week - 3) * 3; // 18 -> 21
  if (week <= 20) return Math.round(21 + (week - 5) * 1.65); // 23 -> 46
  return Math.round(46 + (week - 20) * 0.45); // 46 -> 60
}

function getAvailableTypes(week: number): MeetingType[] {
  return (Object.keys(INTRO_WEEK) as MeetingType[])
    .filter(type => week >= INTRO_WEEK[type] && canAppearInWeek(type, week));
}

function getProgressionConfig(week: number): ProgressionConfig {
  const tuning = curve(week);
  const coverageRamp = Math.min(1, (week - 1) / 19);
  const maxStartMin = roundToSlot(lerp(120, DAY_MINS - tuning.minBlockMins, coverageRamp));
  const availableTypes = getAvailableTypes(week);
  const weights: Partial<Record<MeetingType, number>> = {};

  const setWeight = (type: MeetingType, value: number) => {
    if (availableTypes.includes(type)) {
      weights[type] = value;
    }
  };

  setWeight('personal', week < 6 ? 4 : 2);
  setWeight('lunch', 2 + tuning.lunchRate * 8);
  setWeight('1:1', 3);
  setWeight('team', Math.max(1.2, tuning.teamRate * 10));
  setWeight('boss', Math.max(0.8, tuning.bossRate * 12));
  setWeight('sticky', week < 14 ? 1.4 : 0.9);
  setWeight('focus', 0.9);
  setWeight('optional', 1.1);
  setWeight('recurring', 0.8);
  setWeight('allhands', 0.35);
  setWeight('emergency', 0.45);

  return {
    maxStartMin,
    meetingCount: getMeetingCount(week),
    minDuration: tuning.minBlockMins,
    overlapRate: Math.min(0.28, Math.max(0, (week - 5) * 0.012)),
    weights,
    maxPerType: {
      recurring: 4,
      allhands: 2,
      emergency: 3,
    },
  };
}

/**
 * Generate a deterministic calendar for a given week
 * Single progression model: simple onboarding, then more density, more vertical
 * coverage, more overlaps, and more meeting behaviors over time.
 */
export function generateWeek(week: number): Meeting[] {
  console.log(`🗓️ Generating calendar for Week ${week}...`);

  if (week === 1) {
    return generateWeek1Simple();
  }

  return generateProgressionWeek(week);
}

/**
 * WEEK 1: Super simple - just grey blocks at very top
 */
function generateWeek1Simple(): Meeting[] {
  const meetings: Meeting[] = [];

  // 10 simple blocks across 5 days, all at very top
  for (let day = 0; day < 5; day++) {
    // Two blocks per day, stacked at top
    meetings.push({
      day,
      startMin: 0,        // 9:00 AM - TOP
      endMin: 60,         // 10:00 AM
      type: 'personal',
      title: 'Onboarding'
    });

    meetings.push({
      day,
      startMin: 60,       // 10:00 AM
      endMin: 120,        // 11:00 AM
      type: 'personal',
      title: 'Onboarding'
    });
  }

  console.log(`✅ Week 1: ${meetings.length} simple blocks at TOP of screen`);
  return meetings;
}

/**
 * Generate meetings with staged complexity.
 */
function generateProgressionWeek(week: number): Meeting[] {
  const meetings: Meeting[] = [];
  const rand = mulberry32(0xB0B0 + week);
  const config = getProgressionConfig(week);
  const typeCounts = new Map<MeetingType, number>();

  const pickType = (): MeetingType => {
    const eligible = Object.entries(config.weights)
      .filter(([type]) => {
        const meetingType = type as MeetingType;
        const max = config.maxPerType[meetingType];
        return max === undefined || (typeCounts.get(meetingType) || 0) < max;
      }) as Array<[MeetingType, number]>;

    const totalWeight = eligible.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = rand() * totalWeight;

    for (const [type, weight] of eligible) {
      roll -= weight;
      if (roll <= 0) {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        return type;
      }
    }

    typeCounts.set('personal', (typeCounts.get('personal') || 0) + 1);
    return 'personal';
  };

  const pickDuration = (): number => {
    const options = [15, 30, 45, 60].filter(d => d >= config.minDuration);
    return options[Math.floor(rand() * options.length)] || config.minDuration;
  };

  const pickTitle = (type: MeetingType): string => {
    const titles = MEETING_TITLES[type] || ['Meeting'];
    return titles[Math.floor(rand() * titles.length)];
  };

  for (let i = 0; i < config.meetingCount; i++) {
    const duration = pickDuration();
    let day = Math.floor(rand() * 5);
    let startMin: number;

    if (meetings.length > 0 && rand() < config.overlapRate) {
      const source = meetings[Math.floor(rand() * meetings.length)];
      day = source.day;
      const offset = rand() < 0.5 ? -15 : 15;
      const maxStart = Math.min(config.maxStartMin, DAY_MINS - duration);
      startMin = roundToSlot(Math.max(0, Math.min(maxStart, source.startMin + offset)));
    } else {
      const maxStart = Math.min(config.maxStartMin, DAY_MINS - duration);
      const slotCount = Math.max(1, Math.floor(maxStart / 15) + 1);
      startMin = Math.floor(rand() * slotCount) * 15;
    }

    const type = pickType();

    meetings.push({
      day,
      startMin,
      endMin: startMin + duration,
      type,
      title: pickTitle(type)
    });
  }

  const screenCoverage = Math.round((config.maxStartMin / DAY_MINS) * 100);
  console.log(`✅ Week ${week}: ${meetings.length} meetings, ${screenCoverage}% screen coverage`);
  return meetings;
}

/**
 * Compute column layout for double-booked meetings
 * Renders overlapping meetings side-by-side like real calendars
 */
export function computeColumns(meetings: Meeting[]): RenderItem[] {
  // Group by day
  const byDay = new Map<number, Meeting[]>();
  meetings.forEach(m => {
    const dayMeetings = byDay.get(m.day) || [];
    dayMeetings.push(m);
    byDay.set(m.day, dayMeetings);
  });

  const out: RenderItem[] = [];

  for (const [, list] of byDay) {
    // Sort by start time, then by duration (longer first for better visual stacking)
    list.sort((a, b) =>
      a.startMin - b.startMin ||
      (b.endMin - b.startMin) - (a.endMin - a.startMin)
    );

    // Active set of columns (meetings currently visible)
    const active: RenderItem[] = [];

    for (const m of list) {
      // Expire columns for meetings that have ended
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].endMin <= m.startMin) {
          active.splice(i, 1);
        }
      }

      // Find first free column index
      let col = 0;
      const taken = new Set(active.map(a => a.col));
      while (taken.has(col)) col++;

      const item: RenderItem = { ...m, col, cols: 0 };
      active.push(item);
      out.push(item);

      // Update cols for current overlap cluster
      const maxCol = Math.max(...active.map(a => a.col));
      active.forEach(a => {
        a.cols = Math.max(a.cols, maxCol + 1);
      });
    }
  }

  return out;
}

/**
 * Convert minutes to hour label (e.g., 0 → "9 AM", 480 → "5 PM")
 */
export function minutesToHourLabel(minutes: number, startHour: number = 9): string {
  const totalHours = startHour + Math.floor(minutes / 60);
  const hour12 = totalHours > 12 ? totalHours - 12 : totalHours === 0 ? 12 : totalHours;
  const ampm = totalHours >= 12 ? 'PM' : 'AM';
  return `${hour12} ${ampm}`;
}
