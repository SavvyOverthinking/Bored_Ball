/**
 * Calendar Grid Generator
 * Maps meeting data to game board positions using a calendar layout
 */

import { MeetingType } from './physicsModifiers';

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
}

export interface BlockData {
  id: string;
  title: string;
  type: MeetingType;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Game board configuration
 */
const BOARD_CONFIG = {
  width: 900,
  height: 640,
  padding: 60,
  headerHeight: 60,
};

/**
 * Calendar configuration
 */
const CALENDAR_CONFIG = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  startHour: 9,
  endHour: 17,
  columnGap: 4,
  rowGap: 2,
};

/**
 * Convert time string (HH:MM) to decimal hours
 */
function timeToHours(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

/**
 * Map day name to column index (0-4)
 */
function dayToColumn(day: string): number {
  return CALENDAR_CONFIG.days.indexOf(day);
}

/**
 * Calculate block position and dimensions based on meeting data
 */
function calculateBlockDimensions(meeting: Meeting): Omit<BlockData, 'id' | 'title' | 'type' | 'color'> {
  const columnIndex = dayToColumn(meeting.day);
  const startHour = timeToHours(meeting.startTime);
  const endHour = timeToHours(meeting.endTime);
  
  // Calculate available space for calendar grid
  const gridWidth = BOARD_CONFIG.width - (BOARD_CONFIG.padding * 2);
  const gridHeight = BOARD_CONFIG.height - BOARD_CONFIG.headerHeight - BOARD_CONFIG.padding;
  
  // Calculate column width
  const totalGapWidth = CALENDAR_CONFIG.columnGap * (CALENDAR_CONFIG.days.length - 1);
  const columnWidth = (gridWidth - totalGapWidth) / CALENDAR_CONFIG.days.length;
  
  // Calculate x position
  const x = BOARD_CONFIG.padding + 
            columnIndex * (columnWidth + CALENDAR_CONFIG.columnGap) + 
            columnWidth / 2;
  
  // Calculate y position based on time
  const totalHours = CALENDAR_CONFIG.endHour - CALENDAR_CONFIG.startHour;
  const startOffset = (startHour - CALENDAR_CONFIG.startHour) / totalHours;
  const duration = endHour - startHour;
  const heightRatio = duration / totalHours;
  
  const blockHeight = (gridHeight * heightRatio) - CALENDAR_CONFIG.rowGap;
  const y = BOARD_CONFIG.headerHeight + 
            (gridHeight * startOffset) + 
            blockHeight / 2;
  
  return {
    x,
    y,
    width: columnWidth - 4, // Small padding for visual separation
    height: blockHeight,
  };
}

/**
 * Generate block data from meeting list
 */
export function generateCalendarBlocks(meetings: Meeting[]): BlockData[] {
  return meetings.map(meeting => {
    const dimensions = calculateBlockDimensions(meeting);
    
    return {
      id: meeting.id,
      title: meeting.title,
      type: meeting.type,
      color: meeting.color,
      ...dimensions,
    };
  });
}

/**
 * Get grid configuration for rendering calendar background
 */
export function getCalendarGridConfig() {
  const gridWidth = BOARD_CONFIG.width - (BOARD_CONFIG.padding * 2);
  const gridHeight = BOARD_CONFIG.height - BOARD_CONFIG.headerHeight - BOARD_CONFIG.padding;
  const totalGapWidth = CALENDAR_CONFIG.columnGap * (CALENDAR_CONFIG.days.length - 1);
  const columnWidth = (gridWidth - totalGapWidth) / CALENDAR_CONFIG.days.length;
  
  return {
    padding: BOARD_CONFIG.padding,
    headerHeight: BOARD_CONFIG.headerHeight,
    columnWidth,
    columnGap: CALENDAR_CONFIG.columnGap,
    gridHeight,
    days: CALENDAR_CONFIG.days,
    hours: Array.from(
      { length: CALENDAR_CONFIG.endHour - CALENDAR_CONFIG.startHour + 1 },
      (_, i) => CALENDAR_CONFIG.startHour + i
    ),
  };
}

/**
 * Get board dimensions
 */
export function getBoardDimensions() {
  return {
    width: BOARD_CONFIG.width,
    height: BOARD_CONFIG.height,
  };
}


