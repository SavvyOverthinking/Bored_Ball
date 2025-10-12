/**
 * Phase 2 Calendar Generator
 * Generates deterministic but varied weekly calendars using level curve tuning
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

/**
 * Generate a deterministic calendar for a given week
 * Same week number always produces same layout (reproducible)
 */
export function generateWeek(week: number): Meeting[] {
  const t = curve(week);
  const rand = mulberry32(0xB0B0 + week);  // Stable seed per week
  
  const START_HOUR = 9;
  const END_HOUR = 17;
  const DAY_MINS = (END_HOUR - START_HOUR) * 60; // 480 minutes (8 hours)
  const SLOT_GRANULARITY = 15; // 15-minute slots
  const DAYS = 5; // Mon-Fri
  const totalSlots = (DAY_MINS / SLOT_GRANULARITY) * DAYS;
  
  const targetMeetings = Math.round(totalSlots * t.density);
  const meetings: Meeting[] = [];
  
  // Helper: pick duration >= minBlockMins
  const pickDuration = () => {
    const choices = [15, 30, 45, 60].filter(m => m >= t.minBlockMins);
    return choices[Math.floor(rand() * choices.length)] || 30;
  };
  
  // Helper: pick meeting type based on tuning rates
  const pickType = (): MeetingType => {
    const r = rand();
    if (r < t.bossRate) return 'boss';
    if (r < t.bossRate + t.teamRate) return 'team';
    if (r < t.bossRate + t.teamRate + t.lunchRate) {
      return rand() < 0.5 ? 'lunch' : 'personal';
    }
    return '1:1';
  };
  
  // Helper: generate meeting title
  const titlesByType: Record<MeetingType, string[]> = {
    'boss': ['Exec Review', '1:1 with Manager', 'Performance Review', 'Strategy Sync'],
    'team': ['Team Standup', 'Sprint Planning', 'Team Sync', 'All Hands'],
    '1:1': ['1:1 Sync', 'Weekly Check-in', 'Project Update', 'Coffee Chat'],
    'lunch': ['Lunch Break', 'Team Lunch', 'Lunch & Learn', 'Break'],
    'personal': ['Focus Time', 'Personal', 'OOO', 'Break']
  };
  
  const pickTitle = (type: MeetingType): string => {
    const titles = titlesByType[type] || ['Meeting'];
    return titles[Math.floor(rand() * titles.length)];
  };
  
  // Generate primary meetings
  for (let i = 0; i < targetMeetings; i++) {
    const day = Math.floor(rand() * DAYS);
    const dur = pickDuration();
    const latestStart = DAY_MINS - dur;
    const startMin = Math.floor(rand() * (latestStart / SLOT_GRANULARITY)) * SLOT_GRANULARITY;
    const type = pickType();
    
    meetings.push({
      day,
      startMin,
      endMin: startMin + dur,
      type,
      title: pickTitle(type)
    });
  }
  
  // Inject intentional overlaps (double bookings) for realism in later weeks
  if (week >= 4) {
    const overlapCount = Math.floor(targetMeetings * 0.06); // 6% overlap rate
    for (let k = 0; k < overlapCount; k++) {
      const sourceMeeting = meetings[Math.floor(rand() * meetings.length)];
      if (!sourceMeeting) break;
      
      const dur = pickDuration();
      // Place overlap near source meeting (+/- 15 mins)
      const offset = rand() < 0.5 ? -15 : 15;
      const start = Math.max(0, Math.min(DAY_MINS - dur, sourceMeeting.startMin + offset));
      const type = pickType();
      
      meetings.push({
        day: sourceMeeting.day,
        startMin: start,
        endMin: start + dur,
        type,
        title: pickTitle(type)
      });
    }
  }
  
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
  
  for (const [_day, list] of byDay) {
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

