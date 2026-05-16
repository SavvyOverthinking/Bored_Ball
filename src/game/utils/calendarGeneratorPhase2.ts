/**
 * Phase 2 Calendar Generator
 * CLASSIC ARCADE PROGRESSION:
 * - Days 1-3: Easy (top of screen, few blocks)
 * - Days 4-7: Medium (top half, more blocks)
 * - Days 8-15: Progressive meeting creep
 * - Days 16-25: Calendar crunch and finale
 */

import { mulberry32 } from '@game/utils/rng';
import { type MeetingType, canAppearInWeek } from '@game/systems/physicsModifiers';
import { curve } from '@game/utils/levelCurve';
import { CAMPAIGN_TOTAL_DAYS } from './campaign';

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
export const LUNCH_START_MIN = 150; // 11:30 AM
export const LUNCH_END_MIN = 300;   // 2:00 PM

const INTRO_WEEK: Record<MeetingType, number> = {
  personal: 1,
  lunch: 3,
  '1:1': 2,
  team: 4,
  boss: 6,
  sticky: 8,
  optional: 9,
  focus: 10,
  recurring: 13,
  allhands: 18,
  emergency: 21,
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
  if (week === 2) return 10;
  if (week === 3) return 12;
  if (week === 4) return 14;
  if (week === 5) return 16;
  if (week <= 10) return Math.round(16 + (week - 5) * 1.2);  // 17 -> 22
  if (week <= 15) return Math.round(22 + (week - 10) * 1.4); // 23 -> 29
  if (week <= 20) return Math.round(29 + (week - 15) * 1.2); // 30 -> 35
  return Math.round(35 + (week - 20) * 0.6);                 // 36 -> 38
}

function getAvailableTypes(week: number): MeetingType[] {
  return (Object.keys(INTRO_WEEK) as MeetingType[])
    .filter(type => week >= INTRO_WEEK[type] && canAppearInWeek(type, week));
}

function getProgressionConfig(week: number): ProgressionConfig {
  const tuning = curve(week);
  const coverageRamp = Math.min(1, (week - 1) / (CAMPAIGN_TOTAL_DAYS - 1));
  const maxStartMin = roundToSlot(lerp(120, DAY_MINS - tuning.minBlockMins, coverageRamp));
  const availableTypes = getAvailableTypes(week);
  const weights: Partial<Record<MeetingType, number>> = {};

  const setWeight = (type: MeetingType, value: number) => {
    if (availableTypes.includes(type)) {
      weights[type] = value;
    }
  };

  setWeight('personal', week < 6 ? 4 : 1.8);
  setWeight('lunch', 2 + tuning.lunchRate * 8);
  setWeight('1:1', week < 6 ? 3.5 : 2.4);
  setWeight('team', Math.max(1.2, tuning.teamRate * 10));
  setWeight('boss', Math.max(0.8, tuning.bossRate * 12));
  setWeight('sticky', week < 14 ? 1.2 : 0.8);
  setWeight('focus', 0.9);
  setWeight('optional', 1.1);
  setWeight('recurring', 0.8);
  setWeight('allhands', 0.45);
  setWeight('emergency', 0.55);

  return {
    maxStartMin,
    meetingCount: getMeetingCount(week),
    minDuration: tuning.minBlockMins,
    overlapRate: Math.min(0.28, Math.max(0, (week - 5) * 0.012)),
    weights,
    maxPerType: {
      recurring: 4,
      allhands: 2,
      emergency: 2,
    },
  };
}

/**
 * Generate a deterministic calendar for a given day
 * Single progression model: simple onboarding, then more density, more vertical
 * coverage, more overlaps, and more meeting behaviors over time.
 */
export function generateWeek(week: number): Meeting[] {
  console.log(`🗓️ Generating calendar for Day ${week}...`);

  if (week === 1) {
    return generateWeek1Simple();
  }

  return generateProgressionWeek(week);
}

/**
 * DAY 1: Super simple - just grey blocks at very top
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

  console.log(`✅ Day 1: ${meetings.length} simple blocks at TOP of screen`);
  return meetings;
}

function getScriptedMeetings(week: number): Meeting[] {
  const scripted: Meeting[] = [];

  const add = (day: number, startMin: number, duration: number, type: MeetingType, title?: string) => {
    scripted.push({
      day,
      startMin,
      endMin: startMin + duration,
      type,
      title: title || MEETING_TITLES[type][0]
    });
  };

  if (week === 2) {
    add(1, 0, 60, '1:1', 'First 1:1');
    add(3, 60, 60, '1:1', 'Project Check-in');
  }

  if (week === 3) {
    add(1, LUNCH_START_MIN, 60, 'lunch', 'Lunch Break');
    add(3, LUNCH_START_MIN + 45, 45, 'lunch', 'Team Lunch');
  }

  if (week === 4) {
    add(1, 45, 60, 'team', 'First Team Sync');
    add(3, 105, 60, 'team', 'Retro');
  }

  if (week === 5) {
    add(0, 30, 60, 'team', 'Friday Standup');
    add(2, LUNCH_START_MIN, 60, 'lunch', 'Lunch Reset');
    add(4, 120, 60, '1:1', 'Friday Check-in');
  }

  if (week === 6) {
    add(2, 75, 60, 'boss', 'First Boss Review');
  }

  if (week === 8) {
    add(2, 150, 60, 'sticky', 'Sticky Reminder');
  }

  if (week === 10) {
    add(1, 120, 60, 'optional', 'Optional Office Hours');
    add(3, 180, 60, 'focus', 'Focus Time');
  }

  if (week === 13) {
    add(2, 90, 60, 'recurring', 'Recurring Standup');
  }

  if (week === 18) {
    add(2, 135, 90, 'allhands', 'All-Hands Meeting');
  }

  if (week === 21) {
    add(2, 75, 45, 'emergency', 'Emergency Standup');
  }

  if (week === CAMPAIGN_TOTAL_DAYS) {
    add(1, 60, 60, 'boss', 'Final Manager Review');
    add(2, 150, 90, 'allhands', 'Final All-Hands');
    add(3, 240, 45, 'emergency', 'Launch Incident');
  }

  return scripted;
}

/**
 * Generate meetings with staged complexity.
 */
function generateProgressionWeek(week: number): Meeting[] {
  const meetings: Meeting[] = getScriptedMeetings(week);
  const rand = mulberry32(0xB0B0 + week);
  const config = getProgressionConfig(week);
  const typeCounts = new Map<MeetingType, number>();
  const lunchDays = new Set<number>();

  meetings.forEach(meeting => {
    typeCounts.set(meeting.type, (typeCounts.get(meeting.type) || 0) + 1);
    if (meeting.type === 'lunch') {
      lunchDays.add(meeting.day);
    }
  });

  const pickType = (): MeetingType => {
    const eligible = Object.entries(config.weights)
      .filter(([type]) => {
        const meetingType = type as MeetingType;
        if (meetingType === 'lunch' && lunchDays.size >= 5) {
          return false;
        }
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

  const pickDuration = (type: MeetingType): number => {
    const baseOptions = type === 'lunch' ? [30, 45, 60] : [15, 30, 45, 60];
    const options = baseOptions.filter(d => d >= config.minDuration);
    return options[Math.floor(rand() * options.length)] || config.minDuration;
  };

  const pickLunchStart = (duration: number): number => {
    const latestStart = LUNCH_END_MIN - duration;
    const slotCount = Math.max(1, Math.floor((latestStart - LUNCH_START_MIN) / 15) + 1);
    return LUNCH_START_MIN + Math.floor(rand() * slotCount) * 15;
  };

  const pickTitle = (type: MeetingType): string => {
    const titles = MEETING_TITLES[type] || ['Meeting'];
    return titles[Math.floor(rand() * titles.length)];
  };

  const generatedCount = Math.max(0, config.meetingCount - meetings.length);

  for (let i = 0; i < generatedCount; i++) {
    const type = pickType();
    const duration = pickDuration(type);
    let day = Math.floor(rand() * 5);
    let startMin: number;

    if (type === 'lunch') {
      const availableLunchDays = [0, 1, 2, 3, 4].filter(candidate => !lunchDays.has(candidate));
      day = availableLunchDays[Math.floor(rand() * availableLunchDays.length)] ?? day;
      lunchDays.add(day);
      startMin = pickLunchStart(duration);
    } else if (meetings.length > 0 && rand() < config.overlapRate) {
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

    meetings.push({
      day,
      startMin,
      endMin: startMin + duration,
      type,
      title: pickTitle(type)
    });
  }

  const screenCoverage = Math.round((config.maxStartMin / DAY_MINS) * 100);
  console.log(`✅ Day ${week}: ${meetings.length} meetings, ${screenCoverage}% screen coverage`);
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
