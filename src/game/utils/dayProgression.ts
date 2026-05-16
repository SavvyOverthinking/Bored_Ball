const FIRST_DAY = 1;
const LAST_DAY = 52;

export function readDayOverride(search?: string): number | undefined {
  const query = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const params = new URLSearchParams(query);
  const rawDay = Number(params.get('day'));
  const rawWeek = Number(params.get('week'));
  const day = rawDay || rawWeek;

  if (Number.isInteger(day) && day >= FIRST_DAY && day <= LAST_DAY) {
    return day;
  }

  return undefined;
}

export function getInitialDay(search?: string): number {
  return readDayOverride(search) ?? FIRST_DAY;
}
