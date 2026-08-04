export type RecurrenceType = 'INTERVAL' | 'WEEKDAYS';

export interface RecurrenceRule {
  recurrenceType: RecurrenceType;
  /** Required (and only meaningful) when recurrenceType === 'INTERVAL'. */
  intervalDays: number | null;
  /** Required (and only meaningful) when recurrenceType === 'WEEKDAYS'. 0=Sunday .. 6=Saturday. */
  weekdays: number[] | null;
  startAt: Date;
  endAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The next occurrence strictly after `after`, or `null` once the series has run past
 * `endAt`. `startAt`'s own UTC hour/minute is the time-of-day every occurrence keeps —
 * callers don't need a separate timezone-aware "time of day" field.
 */
export function nextOccurrence(rule: RecurrenceRule, after: Date): Date | null {
  if (rule.recurrenceType === 'INTERVAL') {
    return nextIntervalOccurrence(rule, after);
  }
  return nextWeekdayOccurrence(rule, after);
}

function nextIntervalOccurrence(rule: RecurrenceRule, after: Date): Date | null {
  const intervalMs = rule.intervalDays! * DAY_MS;
  let next: Date;
  if (after.getTime() < rule.startAt.getTime()) {
    next = rule.startAt;
  } else {
    const elapsed = after.getTime() - rule.startAt.getTime();
    const stepsElapsed = Math.floor(elapsed / intervalMs) + 1;
    next = new Date(rule.startAt.getTime() + stepsElapsed * intervalMs);
  }
  return next.getTime() <= rule.endAt.getTime() ? next : null;
}

function nextWeekdayOccurrence(rule: RecurrenceRule, after: Date): Date | null {
  const hours = rule.startAt.getUTCHours();
  const minutes = rule.startAt.getUTCMinutes();
  const weekdaySet = new Set(rule.weekdays);

  let cursor = new Date(after.getTime());
  cursor.setUTCHours(hours, minutes, 0, 0);
  if (cursor.getTime() <= after.getTime()) {
    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  // At most 7 days to find the next matching weekday, +1 as a safety margin.
  for (let i = 0; i < 8; i++) {
    if (weekdaySet.has(cursor.getUTCDay())) {
      return cursor.getTime() <= rule.endAt.getTime() ? cursor : null;
    }
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  return null;
}
