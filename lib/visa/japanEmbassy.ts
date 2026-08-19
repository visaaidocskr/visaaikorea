// Embassy of Japan in Korea — closure/holiday calendar service.
//
// The embassy publishes its OWN annual closure schedule (Korean + Japanese
// national holidays it observes, plus administrative closure days). This is the
// single source of truth — we do NOT independently union every KR and JP public
// holiday. Weekends are handled separately (the embassy is closed Sat/Sun).
//
// ⚠️ MAINTENANCE: verify/update this list each year against the official
// "Embassy of Japan in the Republic of Korea — Holidays" schedule. Movable
// holidays (lunar dates, equinoxes, substitute days) MUST be confirmed — the
// dates below are a maintainable starting point, not legal advice. Updating a
// year = editing one array here; no calendar/UI code changes needed.

export type EmbassyClosure = {
  date: string; // YYYY-MM-DD (Asia/Seoul calendar date)
  name: string;
  source: "Korea" | "Japan" | "Embassy";
};

// Closure days (holidays) by year. Weekends are excluded here — they're blocked
// generically. Holidays that fall on a weekend are harmless if listed (the
// weekend rule catches them first) but are generally omitted below.
const CLOSURES_BY_YEAR: Record<number, EmbassyClosure[]> = {
  2026: [
    { date: "2026-01-01", name: "New Year's Day", source: "Embassy" },
    // Korean New Year (Seollal) — lunar
    { date: "2026-02-16", name: "Korean New Year (Seollal) holiday", source: "Korea" },
    { date: "2026-02-17", name: "Korean New Year (Seollal)", source: "Korea" },
    { date: "2026-02-18", name: "Korean New Year (Seollal) holiday", source: "Korea" },
    { date: "2026-02-11", name: "National Foundation Day (Japan)", source: "Japan" },
    { date: "2026-02-23", name: "Emperor's Birthday (Japan)", source: "Japan" },
    { date: "2026-03-02", name: "Independence Movement Day (substitute)", source: "Korea" },
    { date: "2026-03-20", name: "Vernal Equinox Day (Japan)", source: "Japan" },
    { date: "2026-04-29", name: "Shōwa Day (Japan)", source: "Japan" },
    { date: "2026-05-04", name: "Greenery Day (Japan)", source: "Japan" },
    { date: "2026-05-05", name: "Children's Day", source: "Embassy" },
    { date: "2026-05-06", name: "Constitution Memorial Day (substitute, Japan)", source: "Japan" },
    { date: "2026-05-25", name: "Buddha's Birthday (substitute)", source: "Korea" },
    { date: "2026-07-20", name: "Marine Day (Japan)", source: "Japan" },
    { date: "2026-08-11", name: "Mountain Day (Japan)", source: "Japan" },
    // Chuseok — lunar
    { date: "2026-09-24", name: "Chuseok holiday", source: "Korea" },
    { date: "2026-09-25", name: "Chuseok", source: "Korea" },
    // 2026-09-26 falls on a weekend — covered by the weekend rule.
    { date: "2026-09-21", name: "Respect for the Aged Day (Japan)", source: "Japan" },
    { date: "2026-09-23", name: "Autumnal Equinox Day (Japan)", source: "Japan" },
    { date: "2026-10-09", name: "Hangeul Day", source: "Korea" },
    { date: "2026-10-12", name: "Sports Day (Japan)", source: "Japan" },
    { date: "2026-11-03", name: "Culture Day (Japan)", source: "Japan" },
    { date: "2026-11-23", name: "Labor Thanksgiving Day (Japan)", source: "Japan" },
    { date: "2026-12-25", name: "Christmas Day", source: "Embassy" },
  ],
};

export function getJapanEmbassyClosureDates(year: number): EmbassyClosure[] {
  return CLOSURES_BY_YEAR[year] ?? [];
}

export function allJapanEmbassyClosures(): EmbassyClosure[] {
  return Object.values(CLOSURES_BY_YEAR).flat();
}

export function japanEmbassyClosure(iso: string): EmbassyClosure | null {
  const year = Number(iso.slice(0, 4));
  if (!year) return null;
  return getJapanEmbassyClosureDates(year).find((c) => c.date === iso) ?? null;
}

// Weekday from a calendar date string — timezone-safe (constructed from y/m/d,
// so it never shifts by a day regardless of the runtime timezone).
export function isWeekend(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
  return day === 0 || day === 6;
}

// "Today" as a YYYY-MM-DD calendar date in Asia/Seoul — used as the earliest
// selectable submission date so the cutoff matches the embassy's timezone.
export function seoulTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export type SubmissionBlock = { message: string; closure?: boolean };

// Why a submission date can't be chosen (weekend or embassy closure), or null
// when it's a selectable business day.
export function submissionDateBlock(
  iso: string,
  closures: EmbassyClosure[] = getJapanEmbassyClosureDates(Number(iso.slice(0, 4)))
): SubmissionBlock | null {
  if (isWeekend(iso)) {
    return {
      message:
        "The Embassy of Japan in Korea is closed on Saturdays and Sundays. Please select another business day.",
    };
  }
  const c = closures.find((closure) => closure.date === iso) ?? null;
  if (c) {
    return {
      message: `${c.name} — Embassy closed. Please select another business day.`,
      closure: true,
    };
  }
  return null;
}

export function isSubmissionDateBlocked(iso: string, closures?: EmbassyClosure[]): boolean {
  return submissionDateBlock(iso, closures) !== null;
}
