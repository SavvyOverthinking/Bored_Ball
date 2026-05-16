export const CAMPAIGN_TOTAL_DAYS = 25;
export const WORK_DAYS_PER_WEEK = 5;
export const FINAL_WORK_WEEK = CAMPAIGN_TOTAL_DAYS / WORK_DAYS_PER_WEEK;

export function getWorkWeek(day: number): number {
  return Math.ceil(day / WORK_DAYS_PER_WEEK);
}

export function getDayInWorkWeek(day: number): number {
  return ((day - 1) % WORK_DAYS_PER_WEEK) + 1;
}
