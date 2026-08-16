// Timing rules for a C-3-1 family invitation.
//
// Two facts drive these, both from how the process actually runs rather than
// from a published table:
//   · Papers are handed in on a working day — the accredited agencies and the
//     mission are both closed at the weekend.
//   · A C-3-1 decision takes roughly 24 days on average, so a visit planned
//     sooner than about a month after submission risks the visa simply not
//     being there in time.
//
// Deliberately no public-holiday calendar: Uzbek and Korean holidays both
// apply and we have not confirmed either list, so we block only what we know
// for certain (weekends) rather than inventing closure dates.

export type SubmissionBlock = { message: string; closure?: boolean };

/** Days between submission and the earliest sensible start of the visit. */
export const MIN_DAYS_BEFORE_VISIT = 30;

/** Typical decision time, shown to the client so the 30 days make sense. */
export const TYPICAL_DECISION_DAYS = 24;

// Weekday from a calendar date string — built from y/m/d so it never shifts
// by a day depending on the server's timezone.
function weekday(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
}

export function isWorkingDay(iso: string): boolean {
  const d = weekday(iso);
  return d !== null && d !== 0 && d !== 6;
}

/** Why this day can't be chosen for handing the documents in, or null. */
export function submissionDateBlock(iso: string): SubmissionBlock | null {
  if (!isWorkingDay(iso)) {
    return {
      message:
        "Documents can only be handed in on a working day — the agency and the embassy are both closed at the weekend.",
    };
  }
  return null;
}

/** Earliest date the visit can start, given when the papers go in. */
export function earliestVisitStart(submissionISO: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(submissionISO)) return null;
  const d = new Date(submissionISO);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + MIN_DAYS_BEFORE_VISIT);
  return d.toISOString().slice(0, 10);
}

/** Guarantee end date — the guarantee must cover the whole visit. */
export function guaranteeEnd(startISO: string, months: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startISO)) return null;
  const d = new Date(startISO);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
