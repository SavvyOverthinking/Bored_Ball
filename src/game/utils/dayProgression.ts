import { CAMPAIGN_TOTAL_DAYS } from './campaign';

const FIRST_DAY = 1;

export function readDayOverride(search?: string): number | undefined {
  const query = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const params = new URLSearchParams(query);
  const rawDay = Number(params.get('day'));
  const rawWeek = Number(params.get('week'));
  const day = rawDay || rawWeek;

  if (Number.isInteger(day) && day >= FIRST_DAY && day <= CAMPAIGN_TOTAL_DAYS) {
    return day;
  }

  return undefined;
}

export function getInitialDay(search?: string): number {
  return readDayOverride(search) ?? FIRST_DAY;
}
