// Taipei Mission in Korea — in-person submission-day rule.
//
// Unlike a standard weekend-closure rule, the Taipei Mission in Korea (both
// the Seoul and Busan offices) only accepts visa applications in person on
// Monday, Wednesday, and Friday — Tuesday, Thursday, Saturday, and Sunday are
// not submission days. This mirrors how lib/visa/japanEmbassy.ts blocks
// weekends/closures in the DatePicker: the day stays visible/clickable so the
// reason is shown, it just can't be selected.
//
// ⚠️ This does not encode a public-holiday/closure calendar (unlike Japan's
// CLOSURES_BY_YEAR) — add a similar per-year list here only once the
// mission's official closure schedule is confirmed from a real source. Never
// fabricate specific closure dates.

export type SubmissionBlock = { message: string; closure?: boolean };

const OPEN_WEEKDAYS = new Set([1, 3, 5]); // Mon, Wed, Fri

// Weekday from a calendar date string — timezone-safe (constructed from
// y/m/d, so it never shifts by a day regardless of the runtime timezone).
export function isTaiwanSubmissionDay(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
  return OPEN_WEEKDAYS.has(day);
}

// Why a submission date can't be chosen (not a Mon/Wed/Fri), or null when
// it's a selectable in-person submission day.
export function taiwanSubmissionDateBlock(iso: string): SubmissionBlock | null {
  if (!isTaiwanSubmissionDay(iso)) {
    return {
      message:
        "The Taipei Mission in Korea only accepts applications in person on Monday, Wednesday, and Friday. Please select one of those days.",
    };
  }
  return null;
}
