/**
 * Phase 2 Calendar Generator
 * Progressive difficulty system with special onboarding
 */

import { curve } from './levelCurve';
import { mulberry32 } from './rng';
import type { MeetingType } from './physicsModifiers';

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
 * Generate a deterministic calendar for a given week
 * Progressive difficulty: Week 1 (onboarding) → Week 12 (chaotic) → Week 52 (brutal)
 */
export function generateWeek(week: number): Meeting[] {
  console.log(`🗓️ Generating calendar for Week ${week}...`);
  
  if (week === 1) {
    return generateWeek1Onboarding();
  } else if (week === 2) {
    return generateWeek2Basics();
  } else if (week >= 3 && week <= 12) {
    return generateWeeks3to12Progressive(week);
  } else {
    return generateWeeks13PlusCurve(week);
  }
}

/**
 * WEEK 1: Onboarding - Grey blocks around lunch time
 * Goal: Get player comfortable with mechanics
 */
function generateWeek1Onboarding(): Meeting[] {
  const meetings: Meeting[] = [];
  
  // Lunch is typically 12:00 PM = 180 minutes from 9 AM
  const lunchStartMin = 180; // 12:00 PM
  
  // For each day (Mon-Fri)
  for (let day = 0; day < 5; day++) {
    // One 2-hour onboarding block BEFORE lunch (10:00-12:00)
    meetings.push({
      day,
      startMin: lunchStartMin - 120, // 10:00 AM
      endMin: lunchStartMin,          // 12:00 PM
      type: 'personal',               // Grey color
      title: 'Onboarding'
    });
    
    // One 2-hour onboarding block AFTER lunch (1:00-3:00 PM)
    meetings.push({
      day,
      startMin: lunchStartMin + 60,   // 1:00 PM
      endMin: lunchStartMin + 180,    // 3:00 PM
      type: 'personal',               // Grey color
      title: 'Onboarding'
    });
  }
  
  console.log(`✅ Week 1: ${meetings.length} onboarding blocks (2 per day × 5 days)`);
  return meetings;
}

/**
 * WEEK 2: Basics - 2 of each color (NO Boss yet)
 * Types: Team (green), 1:1 (blue), Lunch (yellow), Personal (purple)
 */
function generateWeek2Basics(): Meeting[] {
  const meetings: Meeting[] = [];
  const rand = mulberry32(0xB0B0 + 2); // Deterministic for week 2
  
  const types: MeetingType[] = ['team', '1:1', 'lunch', 'personal'];
  const typeTitles: Record<MeetingType, string[]> = {
    'team': ['Team Standup', 'Team Sync'],
    '1:1': ['1:1 Check-in', 'Weekly 1:1'],
    'lunch': ['Lunch Break', 'Lunch & Learn'],
    'personal': ['Focus Time', 'Personal Time'],
    'boss': [] // Not used in week 2
  };
  
  // Add 2 of each type (2×4 = 8 meetings total)
  for (const type of types) {
    const titles = typeTitles[type];
    
    for (let i = 0; i < 2; i++) {
      const day = Math.floor(rand() * 5);
      const duration = 60; // 1 hour meetings
      const latestStart = DAY_MINS - duration;
      const startMin = Math.floor(rand() * (latestStart / 15)) * 15; // 15-min slots
      
      meetings.push({
        day,
        startMin,
        endMin: startMin + duration,
        type,
        title: titles[i % titles.length]
      });
    }
  }
  
  console.log(`✅ Week 2: ${meetings.length} meetings (2 of each type, no Boss)`);
  return meetings;
}

/**
 * WEEKS 3-12: Progressive difficulty (First 90 days)
 * Gradually introduce more meetings, Boss meetings, shorter durations
 * By week 12, should be chaotic with lots of overlaps
 */
function generateWeeks3to12Progressive(week: number): Meeting[] {
  const meetings: Meeting[] = [];
  const rand = mulberry32(0xB0B0 + week);
  
  // Progressive parameters (linear interpolation from week 3 to 12)
  const progress = (week - 3) / 9; // 0.0 at week 3, 1.0 at week 12
  
  // Meeting count: 10 (week 3) → 40 (week 12)
  const meetingCount = Math.round(10 + progress * 30);
  
  // Boss meeting rate: 0% (week 3) → 10% (week 12)
  const bossRate = progress * 0.10;
  
  // Team meeting rate: 20% → 30%
  const teamRate = 0.20 + progress * 0.10;
  
  // Lunch rate: 20% → 15%
  const lunchRate = 0.20 - progress * 0.05;
  
  // Min duration: 60 min (week 3) → 30 min (week 12)
  const minDuration = Math.round(60 - progress * 30);
  
  const typeTitles: Record<MeetingType, string[]> = {
    'boss': ['1:1 with Manager', 'Exec Review', 'Strategy Sync'],
    'team': ['Team Standup', 'Sprint Planning', 'Team Retro', 'All Hands'],
    '1:1': ['1:1 Sync', 'Weekly Check-in', 'Project Update', 'Coffee Chat'],
    'lunch': ['Lunch Break', 'Team Lunch', 'Lunch & Learn'],
    'personal': ['Focus Time', 'Personal', 'Deep Work', 'Study Time']
  };
  
  const pickType = (): MeetingType => {
    const r = rand();
    if (r < bossRate) return 'boss';
    if (r < bossRate + teamRate) return 'team';
    if (r < bossRate + teamRate + lunchRate) return 'lunch';
    if (r < bossRate + teamRate + lunchRate + 0.25) return '1:1';
    return 'personal';
  };
  
  const pickDuration = (): number => {
    const durations = [30, 60, 90].filter(d => d >= minDuration);
    return durations[Math.floor(rand() * durations.length)];
  };
  
  const pickTitle = (type: MeetingType): string => {
    const titles = typeTitles[type];
    return titles[Math.floor(rand() * titles.length)];
  };
  
  // Generate meetings
  for (let i = 0; i < meetingCount; i++) {
    const day = Math.floor(rand() * 5);
    const duration = pickDuration();
    const latestStart = DAY_MINS - duration;
    const startMin = Math.floor(rand() * (latestStart / 15)) * 15;
    const type = pickType();
    
    meetings.push({
      day,
      startMin,
      endMin: startMin + duration,
      type,
      title: pickTitle(type)
    });
  }
  
  // Add intentional overlaps starting week 6 (chaos builds)
  if (week >= 6) {
    const overlapCount = Math.round((week - 5) * 0.6); // 0.6 overlaps per week after 5
    for (let i = 0; i < overlapCount && i < 5; i++) {
      const sourceMeeting = meetings[Math.floor(rand() * meetings.length)];
      if (sourceMeeting) {
        const duration = pickDuration();
        const offset = rand() < 0.5 ? -15 : 15;
        const startMin = Math.max(0, Math.min(DAY_MINS - duration, sourceMeeting.startMin + offset));
        const type = pickType();
        
        meetings.push({
          day: sourceMeeting.day,
          startMin,
          endMin: startMin + duration,
          type,
          title: pickTitle(type)
        });
      }
    }
  }
  
  console.log(`✅ Week ${week} (Progressive): ${meetings.length} meetings, ${Math.round(bossRate * 100)}% boss rate`);
  return meetings;
}

/**
 * WEEKS 13+: Follow original difficulty curve
 * Use the tuning system for precise control
 */
function generateWeeks13PlusCurve(week: number): Meeting[] {
  const meetings: Meeting[] = [];
  const rand = mulberry32(0xB0B0 + week);
  const t = curve(week);
  
  const slot = 15; // 15-minute granularity
  const totalSlots = (DAY_MINS / slot) * 5;
  const targetMeetings = Math.round(totalSlots * t.density);
  
  const typeTitles: Record<MeetingType, string[]> = {
    'boss': ['1:1 with Manager', 'Exec Review', 'Performance Review', 'Strategy Sync'],
    'team': ['Team Standup', 'Sprint Planning', 'Team Sync', 'All Hands', 'Retro'],
    '1:1': ['1:1 Sync', 'Weekly Check-in', 'Project Update', 'Coffee Chat'],
    'lunch': ['Lunch Break', 'Team Lunch', 'Lunch & Learn'],
    'personal': ['Focus Time', 'Personal', 'Deep Work', 'OOO']
  };
  
  const pickDuration = (): number => {
    const choices = [15, 30, 45, 60].filter(m => m >= t.minBlockMins);
    return choices[Math.floor(rand() * choices.length)] || 30;
  };
  
  const pickType = (): MeetingType => {
    const r = rand();
    if (r < t.bossRate) return 'boss';
    if (r < t.bossRate + t.teamRate) return 'team';
    if (r < t.bossRate + t.teamRate + t.lunchRate) {
      return rand() < 0.5 ? 'lunch' : 'personal';
    }
    return '1:1';
  };
  
  const pickTitle = (type: MeetingType): string => {
    const titles = typeTitles[type];
    return titles[Math.floor(rand() * titles.length)];
  };
  
  // Generate primary meetings
  for (let i = 0; i < targetMeetings; i++) {
    const day = Math.floor(rand() * 5);
    const dur = pickDuration();
    const latestStart = DAY_MINS - dur;
    const startMin = Math.floor(rand() * (latestStart / slot)) * slot;
    const type = pickType();
    
    meetings.push({
      day,
      startMin,
      endMin: startMin + dur,
      type,
      title: pickTitle(type)
    });
  }
  
  // Add intentional overlaps (realistic double bookings)
  const overlapCount = Math.floor(targetMeetings * 0.06); // 6% overlap rate
  for (let k = 0; k < overlapCount; k++) {
    const sourceMeeting = meetings[Math.floor(rand() * meetings.length)];
    if (sourceMeeting) {
      const dur = pickDuration();
      const offset = rand() < 0.5 ? -15 : 15;
      const startMin = Math.max(0, Math.min(DAY_MINS - dur, sourceMeeting.startMin + offset));
      const type = pickType();
      
      meetings.push({
        day: sourceMeeting.day,
        startMin,
        endMin: startMin + dur,
        type,
        title: pickTitle(type)
      });
    }
  }
  
  console.log(`✅ Week ${week} (Curve): ${meetings.length} meetings, ${Math.round(t.density * 100)}% density`);
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
