import {
  addMinutes,
  areIntervalsOverlapping,
  parse,
  parseISO,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfToday,
} from 'date-fns';

export const startOfDayDate = resetDate(new Date(), 9);

/**
 * Generates an array of 30-minute time slots for a given day using date-fns.
 *
 * The function creates time slots within a predefined working day, starting at 9:00 AM
 * and ending before 5:00 PM. The last generated slot will be at 4:30 PM.
 *
 * @param startFrom - The base date for which the time slots will be generated. The year,
 * month, and day from this date will be used for all generated slots.
 * @returns An array of `Date` objects, where each object represents a 30-minute time
 * slot from 9:00 AM to 4:30 PM on the provided base date.
 */
export const generateTimeSlots = (startFrom: Date | string) => {
  const slots: Date[] = [];
  const startOfDayWork = 9; // 9:00 AM
  const endOfDayWork = 17; // 5:00 PM
  const timeSlotMinutes = 30; // 30 minutes

  const inputDate = new Date(startFrom);
  const startOfDayWorkDate = resetDate(startFrom, startOfDayWork);

  let currentSlot =
    inputDate >= startOfDayWorkDate ? inputDate : startOfDayWorkDate;

  const endTime = resetDate(startFrom, endOfDayWork);

  do {
    slots.push(new Date(currentSlot));
    currentSlot = addMinutes(currentSlot, timeSlotMinutes);
  } while (currentSlot < endTime);

  return slots;
};

export function resetDate(date: Date | string, hours: number): Date {
  const d = new Date(date);
  return setMilliseconds(setSeconds(setMinutes(setHours(d, hours), 0), 0), 0);
}

export const AR_DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];
export const EN_DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const EN_AR_DAYS_OF_WEEK = {
  SUNDAY: 'الأحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

export const AR_TO_EN_DAYS_OF_WEEK = {
  السبت: 'SATURDAY',
  الأحد: 'SUNDAY',
  الاثنين: 'MONDAY',
  الثلاثاء: 'TUESDAY',
  الأربعاء: 'WEDNESDAY',
  الخميس: 'THURSDAY',
  الجمعة: 'FRIDAY',
} as const;

export interface TimeSlot {
  start: string;
  end: string;
}
export function overlap(slots: TimeSlot[]): number {
  const intervals = slots.map(({ start, end }) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return {
      start: startDate > endDate ? endDate : startDate,
      end: startDate > endDate ? startDate : endDate,
    };
  });

  for (let i = 1; i < intervals.length; i++) {
    for (let j = 0; j < i; j++) {
      if (areIntervalsOverlapping(intervals[i], intervals[j])) {
        return i;
      }
    }
  }

  return -1;
}

// /**
//  * Converts a time string in "HH:mm" format to an ISO 8601 string representing today's date at the specified time.
//  *
//  * @param time - A string representing the time in "HH:mm" format (e.g., "14:30").
//  * @returns An ISO 8601 string for today's date at the given time (e.g., "2024-06-07T14:30:00.000Z").
//  */
// export function timeToIso(time: string) {
//   const [hours, minutes] = time.split(':').map(Number);
//   const date = new Date();
//   date.setHours(hours, minutes, 0, 0);
//   return date.toISOString();
// }

/**
 * Convert a plain time string (24-hour clock) into a `Date`
 * whose *date* part is “today”.
 *
 * Accepts:
 *   08:30               → HH:mm
 *   08:30:15            → HH:mm:ss
 *   08:30:15.123456     → HH:mm:ss.SSS…  (any 1-9 frac digits)
 *
 * Throws if the string isn’t a valid time.
 */
export function timeToIso(time: string): string {
  const base = startOfToday(); // 00:00 today
  const patterns = ['HH:mm:ss.SSS', 'HH:mm:ss', 'HH:mm'];

  for (const p of patterns) {
    const d = parse(time, p, base); // date-fns.parse :contentReference[oaicite:0]{index=0}
    if (!isNaN(d.getTime())) return d.toISOString(); // first pattern that parses wins
  }
  throw new RangeError('Invalid 24-hour time string');
}
