// Vietnam e-Visa — submission-day rule.
//
// The e-Visa portal itself is online 24/7, but the application is prepared and
// submitted by our team, and applications are only handled on business days.
// Picking a Saturday or Sunday as the planned application date would therefore
// promise a submission that doesn't happen until Monday — so weekends are
// blocked in the picker, the same way lib/visa/japanEmbassy.ts blocks embassy
// closures and lib/visa/taiwanEmbassy.ts blocks non-submission weekdays.
//
// ⚠️ Deliberately no public-holiday calendar here: Vietnamese/Korean holiday
// closures for this service have not been confirmed from a real source, and
// fabricating specific dates would tell applicants something untrue. Weekends
// are the only rule encoded.

export type SubmissionBlock = { message: string; closure?: boolean };

// Weekday from a calendar date string — timezone-safe (constructed from
// y/m/d, so it never shifts by a day regardless of the runtime timezone).
export function isWeekendISO(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
  return day === 0 || day === 6;
}

// Why an application date can't be chosen, or null when it's a business day.
export function vietnamSubmissionDateBlock(iso: string): SubmissionBlock | null {
  if (isWeekendISO(iso)) {
    return {
      message:
        "Applications aren't submitted on Saturdays or Sundays. Please choose a weekday.",
    };
  }
  return null;
}

export function isVietnamSubmissionDateBlocked(iso: string): boolean {
  return vietnamSubmissionDateBlock(iso) !== null;
}

// The business-day lead-time maths lives in lib/visa/destinations.ts
// (earliestTravelStart), next to the rule table that configures it, so the
// picker's minimum date and server-side validation can't drift apart.
