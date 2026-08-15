// Server-only resolver: returns a VisaRuleset assembled from the DB tables in
// migration 0004, overlaid on the in-code DEFAULT_RULESET. Any slice that is
// empty, missing (migration not applied), or errors falls back to the code
// default — so the app behaves identically whether or not the DB is populated
// (graceful degradation, mirroring lib/email/send.ts).
//
// Server components call resolveRuleset() and pass the result down as a prop;
// the wizard and server actions never query the DB themselves.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEFAULT_RULESET, type VisaRuleset } from "@/lib/visa/ruleset";
import { withTimeout } from "@/lib/with-timeout";
import type { DestinationRule, ContactCard } from "@/lib/visa/destinations";
import type { DestinationEligibility } from "@/lib/visa/eligibility";
import type { DocumentRequirement, PatronymicRule } from "@/lib/visa/types";

type AnyRow = Record<string, unknown>;

// Fetch a table's rows; return null on any error (e.g. table not created yet).
async function safeRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string
): Promise<AnyRow[] | null> {
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error || !Array.isArray(data)) return null;
    return data as AnyRow[];
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function strArr(v: unknown): string[] | undefined {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : undefined;
}

// --- caching ---------------------------------------------------------------
// The ruleset is public reference data that changes very rarely, but it was
// being re-fetched (8 queries) on EVERY /apply load and inside every save/submit
// action. Memoize it process-wide with a short TTL + in-flight dedupe so:
//   * warm loads cost 0 queries;
//   * concurrent requests share one fetch (no thundering herd);
//   * when the DB is unreachable / migration unapplied, the fallback result is
//     cached too, so we don't pay 8 failing round-trips on every request.
// Admin rule edits (future P1) should call clearRulesetCache() to invalidate.
const RULESET_TTL_MS = 60_000;
let rulesetCache: { at: number; data: VisaRuleset } | null = null;
let rulesetInFlight: Promise<VisaRuleset> | null = null;

export function clearRulesetCache(): void {
  rulesetCache = null;
  rulesetInFlight = null;
}

export async function resolveRuleset(): Promise<VisaRuleset> {
  if (rulesetCache && Date.now() - rulesetCache.at < RULESET_TTL_MS) {
    return rulesetCache.data;
  }
  if (rulesetInFlight) return rulesetInFlight;

  // Time-box the DB load: if Supabase is slow/unreachable, fall back to the code
  // defaults quickly instead of blocking the page on a ~7s connection timeout.
  rulesetInFlight = withTimeout(loadRuleset(), 3000, DEFAULT_RULESET)
    .then((data) => {
      rulesetCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      rulesetInFlight = null;
    });
  return rulesetInFlight;
}

async function loadRuleset(): Promise<VisaRuleset> {
  if (!isSupabaseConfigured()) return DEFAULT_RULESET;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return DEFAULT_RULESET;
  }

  // Fetch every slice in parallel; each is independently optional.
  const [
    destRows,
    natRows,
    visaTypeRows,
    embassyRows,
    eligRows,
    dateRows,
    docRows,
    guidanceRows,
  ] = await Promise.all([
    safeRows(supabase, "destinations"),
    safeRows(supabase, "nationalities"),
    safeRows(supabase, "korean_visa_types"),
    safeRows(supabase, "embassies"),
    safeRows(supabase, "eligibility_rules"),
    safeRows(supabase, "destination_date_rules"),
    safeRows(supabase, "required_documents"),
    safeRows(supabase, "country_guidance"),
  ]);

  // Start from the code defaults; overlay only slices the DB actually provides.
  const out: VisaRuleset = { ...DEFAULT_RULESET };

  // --- embassies (needed before date rules so we can attach contacts) ------
  const embassies = overlayEmbassies(embassyRows, out.embassies);
  out.embassies = embassies;

  // --- destinations + cities ----------------------------------------------
  if (destRows && destRows.length) {
    const active = destRows
      .filter((r) => r.active !== false)
      .sort(byOrderThenName("country"));
    out.destinations = active.map((r) => str(r.country));
    out.cities = Object.fromEntries(
      active.map((r) => [str(r.country), strArr(r.cities) ?? []])
    );
  }

  // --- nationalities + demonyms + patronymic ------------------------------
  if (natRows && natRows.length) {
    const active = natRows
      .filter((r) => r.active !== false)
      .sort(byOrderThenName("name"));
    out.nationalities = active.map((r) => str(r.name));
    out.demonyms = { ...out.demonyms };
    out.patronymic = { ...out.patronymic };
    for (const r of active) {
      const name = str(r.name);
      if (r.demonym) out.demonyms[name] = str(r.demonym);
      out.patronymic[name] = (str(r.patronymic_rule) || "optional") as PatronymicRule;
    }
  }

  // --- korean visa types ---------------------------------------------------
  if (visaTypeRows && visaTypeRows.length) {
    out.koreanVisaTypes = visaTypeRows
      .filter((r) => r.active !== false)
      .sort(byOrderThenName("label"))
      .map((r) => str(r.label));
  }

  // --- eligibility matrix --------------------------------------------------
  if (eligRows && eligRows.length) {
    out.eligibility = overlayEligibility(eligRows, out.eligibility);
  }

  // --- date rules (attach embassy contacts) -------------------------------
  if (dateRows && dateRows.length) {
    out.dateRules = overlayDateRules(dateRows, out.dateRules, embassies);
  } else {
    // Even without DB date rules, refresh contacts from DB embassies if any.
    out.dateRules = attachContacts(out.dateRules, embassies);
  }

  // --- documents (base + status, destination-independent) -----------------
  if (docRows && docRows.length) {
    const { base, statusDocs } = overlayDocuments(docRows);
    if (base.length) out.baseDocuments = base;
    if (Object.keys(statusDocs).length) out.statusDocuments = statusDocs;
  }

  // --- country guidance ----------------------------------------------------
  if (guidanceRows && guidanceRows.length) {
    out.countryGuidance = { ...out.countryGuidance };
    for (const r of guidanceRows) {
      const dest = str(r.destination_country);
      if (!dest) continue;
      out.countryGuidance[dest] = {
        visaValidity: str(r.visa_validity),
        maxStay: str(r.max_stay),
        processingTime: str(r.processing_time),
        whyRecommendedDates: str(r.why_recommended_dates),
        risksTooClose: str(r.risks_too_close),
        recommendedDuration: str(r.recommended_duration),
        importantNotes: strArr(r.important_notes) ?? [],
      };
    }
  }

  return out;
}

// --- overlay helpers -------------------------------------------------------

function byOrderThenName(nameKey: string) {
  return (a: AnyRow, b: AnyRow) => {
    const oa = num(a.sort_order) ?? 100;
    const ob = num(b.sort_order) ?? 100;
    if (oa !== ob) return oa - ob;
    return str(a[nameKey]).localeCompare(str(b[nameKey]));
  };
}

function overlayEmbassies(
  rows: AnyRow[] | null,
  fallback: Record<string, ContactCard[]>
): Record<string, ContactCard[]> {
  if (!rows || !rows.length) return fallback;
  const grouped: Record<string, ContactCard[]> = {};
  for (const r of rows.slice().sort(byOrderThenName("office"))) {
    const dest = str(r.destination_country);
    if (!dest) continue;
    (grouped[dest] ??= []).push({
      office: str(r.office),
      address: str(r.address),
      phone: str(r.phone),
      email: r.email ? str(r.email) : undefined,
    });
  }
  // Merge: DB destinations override; code-only destinations stay.
  return { ...fallback, ...grouped };
}

function overlayEligibility(
  rows: AnyRow[],
  fallback: Record<string, DestinationEligibility>
): Record<string, DestinationEligibility> {
  const byDest: Record<string, AnyRow[]> = {};
  for (const r of rows) {
    const dest = str(r.destination_country);
    if (!dest) continue;
    (byDest[dest] ??= []).push(r);
  }
  const out: Record<string, DestinationEligibility> = { ...fallback };
  for (const [dest, destRows] of Object.entries(byDest)) {
    const defaultRow = destRows.find((r) => !r.nationality);
    const fallbackDest = fallback[dest];
    const defaultRule = defaultRow
      ? toEligibilityRule(defaultRow)
      : fallbackDest?.default ?? { outcome: "visa_required" as const };
    const byNationality: DestinationEligibility["byNationality"] = {};
    for (const r of destRows) {
      if (!r.nationality) continue;
      byNationality[str(r.nationality)] = toEligibilityRule(r);
    }
    out[dest] = { default: defaultRule, byNationality };
  }
  return out;
}

function toEligibilityRule(r: AnyRow) {
  return {
    outcome: str(r.outcome) as "visa_free" | "evisa" | "visa_required",
    maxStayDays: num(r.max_stay_days),
    note: r.note ? str(r.note) : undefined,
    entryConditions: strArr(r.entry_conditions),
    travelGuidance: strArr(r.travel_guidance),
  };
}

function overlayDateRules(
  rows: AnyRow[],
  fallback: Record<string, DestinationRule>,
  embassies: Record<string, ContactCard[]>
): Record<string, DestinationRule> {
  const out: Record<string, DestinationRule> = { ...fallback };
  for (const r of rows) {
    const dest = str(r.destination_country);
    if (!dest) continue;
    const prev = fallback[dest];
    out[dest] = {
      anchorLabel: str(r.anchor_label),
      anchorRequired: r.anchor_required !== false,
      leadMinDays: num(r.lead_min_days) ?? prev?.leadMinDays ?? 0,
      leadMaxDays: num(r.lead_max_days),
      leadMaxMonths: num(r.lead_max_months),
      minStayDays: num(r.min_stay_days) ?? prev?.minStayDays ?? 1,
      maxStayDays: num(r.max_stay_days) ?? prev?.maxStayDays ?? 15,
      recommendedStayMin: num(r.recommended_stay_min) ?? prev?.recommendedStayMin ?? 1,
      recommendedStayMax: num(r.recommended_stay_max) ?? prev?.recommendedStayMax ?? 1,
      maxStayError: str(r.max_stay_error),
      leadTooSoonError: str(r.lead_too_soon_error),
      bankRecommendationKRW: num(r.bank_recommendation_krw) ?? 0,
      guidance: str(r.guidance),
      processingText: str(r.processing_text),
      contacts: embassies[dest] ?? prev?.contacts ?? [],
      documents: prev?.documents ?? [],
      requiresAppointment: r.requires_appointment === true,
      appointmentInfo: (r.appointment_info as DestinationRule["appointmentInfo"]) ?? undefined,
    };
  }
  return out;
}

function attachContacts(
  rules: Record<string, DestinationRule>,
  embassies: Record<string, ContactCard[]>
): Record<string, DestinationRule> {
  if (!Object.keys(embassies).length) return rules;
  const out: Record<string, DestinationRule> = {};
  for (const [dest, rule] of Object.entries(rules)) {
    out[dest] = embassies[dest] ? { ...rule, contacts: embassies[dest] } : rule;
  }
  return out;
}

function overlayDocuments(rows: AnyRow[]): {
  base: DocumentRequirement[];
  statusDocs: Record<string, DocumentRequirement[]>;
} {
  // Only destination-independent rows define the status-level checklist used by
  // documentsForStatus (matches current behavior: docs depend on visa status).
  const relevant = rows.filter(
    (r) => !r.destination_country && r.active !== false
  );
  const sorted = relevant.slice().sort(byOrderThenName("doc_key"));
  const base: DocumentRequirement[] = [];
  const statusDocs: Record<string, DocumentRequirement[]> = {};
  for (const r of sorted) {
    const doc: DocumentRequirement = {
      key: str(r.doc_key),
      labelEn: str(r.label_en),
      labelKo: r.label_ko ? str(r.label_ko) : undefined,
      required: r.required !== false,
      hint: r.hint ? str(r.hint) : undefined,
    };
    const code = r.korean_visa_code ? str(r.korean_visa_code) : "";
    if (!code) base.push(doc);
    else (statusDocs[code] ??= []).push(doc);
  }
  return { base, statusDocs };
}
