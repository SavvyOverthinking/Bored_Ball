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

/**
 * CLASSIC ARCADE PROGRESSION CONFIG
 * Meetings start at TOP and gradually fill down over first 10 weeks
 */
interface ArcadeConfig {
  maxStartMin: number;    // How far down meetings can start (0=top, 480=bottom)
  meetingCount: number;   // Number of meetings to generate
  minDuration: number;    // Minimum meeting duration
  bossRate: number;       // Chance of boss meeting
  teamRate: number;       // Chance of team meeting
}

function getArcadeConfig(week: number): ArcadeConfig {
  // Classic arcade: start easy at top, get harder over 10 levels
  if (week <= 2) {
    // EASY: Top of screen only, few meetings
    return {
      maxStartMin: 120,     // Only 9am-11am area
      meetingCount: 8 + week * 2,
      minDuration: 60,
      bossRate: 0,
      teamRate: 0.1,
    };
  } else if (week <= 5) {
    // MEDIUM-EASY: Top third, more meetings
    return {
      maxStartMin: 180,     // 9am-12pm area
      meetingCount: 12 + (week - 2) * 3,
      minDuration: 45,
      bossRate: 0.02,
      teamRate: 0.15,
    };
  } else if (week <= 8) {
    // MEDIUM: Top half, introduce variety
    return {
      maxStartMin: 240,     // 9am-1pm area
      meetingCount: 20 + (week - 5) * 4,
      minDuration: 30,
      bossRate: 0.05,
      teamRate: 0.18,
    };
  } else if (week <= 10) {
    // MEDIUM-HARD: 3/4 of screen
    return {
      maxStartMin: 360,     // 9am-3pm area
      meetingCount: 30 + (week - 8) * 5,
      minDuration: 30,
      bossRate: 0.08,
      teamRate: 0.20,
    };
  } else {
    // HARD: Full screen (plateau) - use curve system
    return {
      maxStartMin: DAY_MINS - 30, // Full calendar
      meetingCount: 45 + Math.min(week - 10, 20) * 2,
      minDuration: 15,
      bossRate: 0.10,
      teamRate: 0.22,
    };
  }
}

/**
 * Generate a deterministic calendar for a given week
 * CLASSIC ARCADE: Easy at top, gradually fills down
 */
export function generateWeek(week: number): Meeting[] {
  console.log(`🗓️ Generating calendar for Week ${week}...`);

  if (week === 1) {
    return generateWeek1Simple();
  }

  return generateArcadeProgression(week);
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
 * Generate meetings with classic arcade progression
 * Blocks start at top, gradually fill down over 10 levels
 */
function generateArcadeProgression(week: number): Meeting[] {
  const meetings: Meeting[] = [];
  const rand = mulberry32(0xB0B0 + week);
  const config = getArcadeConfig(week);

  // Simple types for early weeks, more variety later
  const getAvailableTypes = (): MeetingType[] => {
    const types: MeetingType[] = ['personal', 'lunch', '1:1'];

    if (week >= 3) types.push('team');
    if (week >= 5) types.push('boss');
    if (week >= 8) types.push('sticky');
    if (week >= 12) types.push('focus', 'optional');
    if (canAppearInWeek('recurring', week)) types.push('recurring');
    if (canAppearInWeek('allhands', week)) types.push('allhands');
    if (canAppearInWeek('emergency', week)) types.push('emergency');

    return types;
  };

  const availableTypes = getAvailableTypes();

  const pickType = (): MeetingType => {
    const r = rand();

    // Boss meetings (if available)
    if (availableTypes.includes('boss') && r < config.bossRate) {
      return 'boss';
    }

    // Team meetings (if available)
    if (availableTypes.includes('team') && r < config.bossRate + config.teamRate) {
      return 'team';
    }

    // Random from available types
    const simpleTypes = availableTypes.filter(t => !['boss', 'team', 'allhands', 'emergency'].includes(t));
    return simpleTypes[Math.floor(rand() * simpleTypes.length)] || 'personal';
  };

  const pickDuration = (): number => {
    const options = [30, 45, 60].filter(d => d >= config.minDuration);
    return options[Math.floor(rand() * options.length)] || 30;
  };

  const pickTitle = (type: MeetingType): string => {
    const titles = MEETING_TITLES[type] || ['Meeting'];
    return titles[Math.floor(rand() * titles.length)];
  };

  // Generate meetings - KEY: startMin is constrained to top of screen early on
  for (let i = 0; i < config.meetingCount; i++) {
    const day = Math.floor(rand() * 5);
    const duration = pickDuration();

    // CRITICAL: Limit how far down meetings can start based on week
    const maxStart = Math.min(config.maxStartMin, DAY_MINS - duration);
    const startMin = Math.floor(rand() * (maxStart / 15)) * 15;

    const type = pickType();

    meetings.push({
      day,
      startMin,
      endMin: startMin + duration,
      type,
      title: pickTitle(type)
    });
  }

  // Add some overlaps for later weeks (double bookings)
  if (week >= 6) {
    const overlapCount = Math.min(Math.floor((week - 5) * 0.8), 8);
    for (let i = 0; i < overlapCount; i++) {
      const source = meetings[Math.floor(rand() * meetings.length)];
      if (source) {
        const duration = pickDuration();
        const offset = rand() < 0.5 ? -15 : 15;
        const startMin = Math.max(0, Math.min(config.maxStartMin - duration, source.startMin + offset));

        meetings.push({
          day: source.day,
          startMin,
          endMin: startMin + duration,
          type: pickType(),
          title: pickTitle(pickType())
        });
      }
    }
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
