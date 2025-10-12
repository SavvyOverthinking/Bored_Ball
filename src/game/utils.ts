/**
 * Utility Functions
 * Helper functions for time calculations and formatting
 */

/**
 * Calculate minutes between two time strings
 * @param start - Start time "HH:MM"
 * @param end - End time "HH:MM"
 * @returns Duration in minutes
 */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * Get sprite key based on meeting duration
 * @param minutes - Meeting duration in minutes
 * @returns Sprite frame key
 */
export function getEventKeyByDuration(minutes: number): string {
  if (minutes <= 15) return 'event_15';
  if (minutes <= 30) return 'event_30';
  if (minutes <= 45) return 'event_45';
  return 'event_60';
}

/**
 * Format time for display (12-hour with AM/PM)
 * @param hour - Hour (0-23)
 * @returns Formatted time string
 */
export function formatTime(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

