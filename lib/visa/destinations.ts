// Destination rule engine. Pure + isomorphic: imported by both the client
// wizard and the server actions so validation can't be bypassed. In Phase 4
// these defaults move into the admin-editable `destination_rules` table.

export type ContactCard = {
  office: string;
  address: string;
  phone: string;
  email?: string;
};

// Appointment-first destinations (Spain) show this card before date planning.
export type AppointmentInfo = {
  title: string;
  message: string;
  officialUrl: string;
  supportUrl: string;
};

export type DestinationRule = {
  // Date lead time is measured from the "anchor" date — the planned
  // submission date (Japan/Taiwan/Singapore) or the embassy appointment date
  // (Spain).
  anchorLabel: string;
  anchorRequired: boolean; // Japan defaults to today if blank
  leadMinDays: number;
  leadMaxDays?: number;
  leadMaxMonths?: number;
  minStayDays: number;
  maxStayDays: number;
  // Recommended (not enforced) trip length shown as guidance, e.g. 4–5 days.
  recommendedStayMin: number;
  recommendedStayMax: number;
  maxStayError: string; // exact red-error copy when stay exceeds the cap
  leadTooSoonError: string;
  bankRecommendationKRW: number;
  guidance: string;
  processingText: string;
  contacts: ContactCard[];
  documents: string[];
  // Spain only: a confirmed embassy appointment is required before planning.
  requiresAppointment?: boolean;
  appointmentInfo?: AppointmentInfo;
  // Vietnam only: `leadMinDays` counts BUSINESS days, not calendar days, and
  // travel starts the day after processing finishes. An application filed on
  // a Friday isn't worked on over the weekend, so counting calendar days
  // would promise the visa days earlier than it can actually arrive. See
  // earliestTravelStart() below.
  leadCountsBusinessDays?: boolean;
};

// --- Japan address → processing-type detection ----------------------------
// Sticker route (Busan Consulate) vs e-Visa route elsewhere.
export const KOREA_REGIONS = [
  "Seoul",
  "Incheon",
  "Gyeonggi-do",
  "Gangwon-do",
  "Daejeon",
  "Sejong",
  "Chungcheongbuk-do",
  "Chungcheongnam-do",
  "Gwangju",
  "Jeollabuk-do",
  "Jeollanam-do",
  "Busan",
  "Daegu",
  "Ulsan",
  "Gyeongsangbuk-do",
  "Gyeongsangnam-do",
  "Jeju-do",
] as const;

// Japan visa routing — single source of truth. Every sticker-route region is
// handled through the Busan Consulate; everywhere else is e-Visa eligible.
export const JAPAN_STICKER_REGIONS = [
  "Busan",
  "Daegu",
  "Gyeongsangbuk-do",
  "Gyeongsangnam-do",
  "Ulsan",
] as const;

export const JAPAN_ROUTE_LABELS = {
  sticker: "Sticker Visa (Busan Consulate)",
  evisa: "Electronic Visa (e-Visa Eligible)",
} as const;

const STICKER_REGIONS = new Set<string>(JAPAN_STICKER_REGIONS);

// Keywords (EN + KO) used to cross-check the typed ARC address.
const STICKER_ADDRESS_KEYWORDS = [
  "busan", "부산",
  "gimhae", "김해",
  "daegu", "대구",
  "ulsan", "울산",
  "pohang", "포항",
  "gyeongsangbuk", "gyeongbuk", "경상북도", "경북",
  "gyeongsangnam", "gyeongnam", "경상남도", "경남",
];

export function regionIsSticker(region: string): boolean {
  return STICKER_REGIONS.has(region);
}

export function addressSuggestsSticker(address: string): boolean {
  const a = address.toLowerCase();
  return STICKER_ADDRESS_KEYWORDS.some((kw) => a.includes(kw));
}

export function japanProcessingType(
  region: string,
  address: string
): "sticker" | "evisa" {
  // The dropdown region is authoritative; the address is a cross-check.
  if (region) return regionIsSticker(region) ? "sticker" : "evisa";
  return addressSuggestsSticker(address) ? "sticker" : "evisa";
}

// Human-readable Japan visa route for a Korea province/region.
export type JapanRoute = { type: "sticker" | "evisa"; label: string };

export function japanRouteForRegion(region: string): JapanRoute {
  const type: JapanRoute["type"] = regionIsSticker(region) ? "sticker" : "evisa";
  return { type, label: JAPAN_ROUTE_LABELS[type] };
}

// --- Taiwan: two Korea-based mission offices --------------------------------
// Taiwan also has two offices in Korea (Taipei Mission in Korea): the main
// office in Seoul and a Busan office — same real-world Yeongnam-area split
// used for Japan's sticker route, so it reuses the same region set. UNLIKE
// Japan, this is NOT a mandatory routing: the applicant is free to submit
// through either office regardless of where they live in Korea. The two
// offices differ only in their bank-statement requirement, which is what this
// detection is for — showing the applicant the right expectation up front.
export type TaiwanOffice = {
  type: "seoul" | "busan";
  label: string;
  bankRequirement: string;
};

const TAIWAN_OFFICE_INFO: Record<TaiwanOffice["type"], Omit<TaiwanOffice, "type">> = {
  seoul: {
    label: "Taipei Mission in Korea (Seoul)",
    bankRequirement:
      "Requires a recent 3-month bank transaction history in addition to the 1-day balance certificate — the balance must have been at least 5,000,000 KRW for at least the last 10 days, not just deposited right before applying.",
  },
  busan: {
    label: "Taipei Mission in Korea, Busan Office",
    bankRequirement:
      "Only requires a 1-day bank balance certificate (min. 5,000,000 KRW) — no 3-month transaction history needed.",
  },
};

export function taiwanOfficeForRegion(region: string): TaiwanOffice {
  const type: TaiwanOffice["type"] = regionIsSticker(region) ? "busan" : "seoul";
  return { type, ...TAIWAN_OFFICE_INFO[type] };
}

// --- Date helpers ----------------------------------------------------------
function parseISO(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d)
    return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// Vietnam's e-Visa grants a flat 30-day stay — not a calendar month, so the
// length never varies with the month entered. Counted inclusively (the entry
// day is day 1), the last day in Vietnam is 29 days after entry: enter 26 Aug
// → leave by 24 Sep. Exported so the wizard can auto-fill (and lock) the
// travel end date once the start date is chosen, instead of letting the
// applicant pick an arbitrary stay length.
export const VIETNAM_EVISA_STAY_DAYS = 30;

export function vietnamStayEndISO(startISO: string): string {
  const start = parseISO(startISO);
  if (!start) return "";
  return toISO(addDays(start, VIETNAM_EVISA_STAY_DAYS - 1));
}

function isWeekendDate(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// `businessDays` working days after `date`, skipping Saturdays and Sundays.
// Counting starts the day AFTER `date` — the application day itself is not a
// processing day.
function addBusinessDays(date: Date, businessDays: number): Date {
  const d = new Date(date);
  let remaining = businessDays;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (!isWeekendDate(d)) remaining -= 1;
  }
  return d;
}

// The earliest travel start date allowed for an anchor (submission/appointment)
// date — the single source of truth used by BOTH the picker's minimum and
// server-side validation, so the rule can't be bypassed from the client.
//
// Calendar-day destinations: anchor + leadMinDays.
// Business-day destinations (Vietnam): the visa needs leadMinDays *working*
// days to be processed, and travel can start the day after the last of them.
// e.g. filed Friday → processed Mon–Thu → earliest travel the next Friday.
export function earliestTravelStart(rule: DestinationRule, anchor: Date): Date {
  if (!rule.leadCountsBusinessDays) return addDays(anchor, rule.leadMinDays);
  return addDays(addBusinessDays(anchor, rule.leadMinDays), 1);
}

// --- The rules ------------------------------------------------------------
export const DESTINATION_RULES: Record<string, DestinationRule> = {
  Japan: {
    anchorLabel: "Planned submission date",
    anchorRequired: false,
    leadMinDays: 8,
    leadMaxDays: 90,
    minStayDays: 1,
    maxStayDays: 15,
    recommendedStayMin: 4,
    recommendedStayMax: 5,
    maxStayError:
      "For Japan tourist visa documents, your planned stay must be between 1 and 15 days. Please choose a shorter stay.",
    leadTooSoonError:
      "Japan tourist visa review usually takes about a week. Choose a travel start date at least 8 days after your submission date.",
    bankRecommendationKRW: 5_000_000,
    guidance:
      "Vitamin VisaAI prepares your Japan tourist visa document package based on the information you provide. We recommend choosing your travel date at least 10 days after the planned visa submission date because Japan tourist visa review may take about 7–10 days after submission. For document planning, the travel start date should be within 30 days and the stay should be between 1 and 15 days.",
    processingText:
      "Sticker-route applicants (Busan Consulate) submit the original passport through a designated travel agency; the embassy generally does not accept direct tourist submissions. e-Visa-route applicants do not send the original passport unless instructed.",
    contacts: [],
    documents: [
      "Original passport",
      "Visa application form",
      "Recent photo 3.5 × 4.5 cm",
      "Travel itinerary",
      "Air ticket reservation",
      "Hotel reservation",
      "ARC front and back",
      "Student or work document (by Korean visa status)",
      "Bank balance certificate / 잔고증명서 (recommended min 5,000,000 KRW per applicant)",
    ],
  },

  Taiwan: {
    anchorLabel: "Planned submission date",
    anchorRequired: true,
    leadMinDays: 10,
    leadMaxDays: 90,
    minStayDays: 1,
    maxStayDays: 14,
    recommendedStayMin: 4,
    recommendedStayMax: 5,
    maxStayError:
      "For Taiwan tourist visa documents, your planned stay must be between 1 and 14 days. Please choose a shorter stay.",
    leadTooSoonError:
      "Choose a travel start date at least 10 days after your submission date. Taiwan processing typically takes 8–10 business days.",
    bankRecommendationKRW: 5_000_000,
    guidance:
      "Taiwan has two mission offices in Korea (Seoul and Busan) and, unlike Japan, applicants may submit through either one regardless of where they live in Korea. Their bank-statement requirements differ: the Busan office only needs a 1-day bank balance certificate (min. 5,000,000 KRW); the Seoul office additionally requires a recent 3-month bank transaction history showing at least 5,000,000 KRW maintained for the last 10+ days, so the funds are shown not to have been deposited only at the last minute. Visa processing may take around 10 working days; the visa is generally valid for 3 months from issue date. Submission days: Mon / Wed / Fri. Passport pickup days: Tue / Thu (subject to office practice).",
    processingText:
      "Sticker visa — the original passport is submitted/kept during processing. Documents should be printed.",
    contacts: [
      {
        office: "Taipei Mission in Korea (Seoul)",
        address: "6F, Gwanghwamun Building, 149 Sejong-daero, Jongno-gu, Seoul",
        phone: "02-6329-6000",
        email: "kor@mofa.gov.tw",
      },
      {
        office: "Taipei Mission in Korea, Busan Office",
        address: "9F Dongbang Building, 70 Jungang-daero, Jung-gu, Busan",
        phone: "051-463-7965",
        email: "pus@mofa.gov.tw",
      },
    ],
    documents: [
      "Original passport",
      "Application form",
      "Daily travel plan / itinerary",
      "Appointment confirmation print",
      "Recent photo 3.5 × 4.5 cm",
      "One-day bank balance certificate (recommended min 5,000,000 KRW) — required by both the Seoul and Busan offices",
      "Recent 3-month bank transaction history (min. 5,000,000 KRW balance maintained for the last 10+ days) — required ONLY if submitting through the Seoul office; not required by the Busan office",
      "Student/work document (by Korean visa status)",
      "Round-trip air ticket reservation",
      "Hotel booking reservation",
    ],
  },

  Singapore: {
    anchorLabel: "Planned submission date",
    anchorRequired: true,
    leadMinDays: 8,
    leadMaxDays: 90,
    minStayDays: 1,
    maxStayDays: 7,
    recommendedStayMin: 4,
    recommendedStayMax: 5,
    maxStayError:
      "For Singapore tourist visa documents, your planned stay must be between 1 and 7 days. Please choose a shorter stay.",
    leadTooSoonError:
      "Choose a travel start date at least 8 days after your submission date.",
    bankRecommendationKRW: 5_000_000,
    guidance:
      "Visa applications at the Singapore Embassy are by appointment only — there are no walk-in applications. According to the embassy, there are no authorised visa agents in Korea, so this platform only prepares documents and is not an official agent. The passport is submitted and the embassy returns the visa according to its process.",
    processingText:
      "Processing usually takes several working days (subject to embassy guidance).",
    contacts: [
      {
        office: "Embassy of the Republic of Singapore in Seoul",
        address:
          "28th Floor, Seoul Finance Center, 136 Sejong-daero, Jung-gu, Seoul 04520",
        phone: "02-774-2464 / 02-774-2465",
        email: "singemb_seo@mfa.sg",
      },
    ],
    documents: [
      "Original passport",
      "Form 14A",
      "Daily travel plan / itinerary",
      "Appointment confirmation",
      "Recent photo 3.5 × 4.5 cm",
      "Bank balance certificate (recommended min 5,000,000 KRW)",
      "Student/work document (by Korean visa status)",
      "Round-trip air ticket reservation",
      "Hotel booking reservation",
      "Form V39A / Letter of Introduction (may be required by nationality/case)",
    ],
  },

  Spain: {
    anchorLabel: "Appointment Date",
    anchorRequired: true,
    leadMinDays: 22,
    leadMaxMonths: 3,
    minStayDays: 1,
    maxStayDays: 12,
    recommendedStayMin: 4,
    recommendedStayMax: 7,
    requiresAppointment: true,
    appointmentInfo: {
      title: "Spain Visa Appointment Required",
      message:
        "Before planning your travel dates, please secure an embassy appointment. Enter your confirmed appointment date below to continue.",
      officialUrl:
        "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx",
      supportUrl: "https://t.me/superDiscussion",
    },
    maxStayError:
      "For Spain Schengen visa documents, your planned stay must be between 1 and 12 days. Please choose a shorter stay.",
    leadTooSoonError:
      "For Spain Schengen visa document planning, choose a travel start date at least 22 days after your appointment date. This gives safer time for visa review and document processing.",
    bankRecommendationKRW: 5_000_000,
    guidance:
      "Spain Schengen visa applications in Korea are processed for applicants who live in Korea and hold a valid Korean ARC. By default this platform uses Embassy of Spain in Seoul guidance. Travel medical insurance covering the Schengen area is normally required.",
    processingText:
      "Submit at the embassy by appointment; choose a travel date at least 21 days out and within 3 months of the appointment.",
    contacts: [
      {
        office: "Embassy of Spain in Seoul",
        address: "17 Hannam-daero 36-gil, Yongsan-gu, Seoul 04417",
        phone: "02-794-3581",
      },
    ],
    documents: [
      "Passport",
      "Schengen visa application form",
      "Recent passport photo",
      "Korean ARC front/back",
      "Travel medical insurance",
      "Round-trip air ticket reservation",
      "Hotel booking reservation",
      "Daily travel itinerary",
      "Proof of financial means / bank certificate / statements",
      "Student/work document (by Korean visa status)",
      "Appointment confirmation",
      "Cover letter / travel purpose letter",
      "Residence proof in Korea (if needed)",
    ],
  },

  // Vietnam — pure e-Visa flow, no embassy appointment and no official
  // multi-page form to replicate. We collect the applicant's data and the
  // admin submits it directly on Vietnam's e-Visa portal.
  Vietnam: {
    anchorLabel: "Planned application date",
    anchorRequired: false,
    leadMinDays: 4,
    leadCountsBusinessDays: true,
    leadMaxDays: 90,
    // The end date isn't chosen by the applicant — it's computed as exactly
    // 30 days from entry, so both bounds are that same fixed number.
    minStayDays: VIETNAM_EVISA_STAY_DAYS,
    maxStayDays: VIETNAM_EVISA_STAY_DAYS,
    recommendedStayMin: VIETNAM_EVISA_STAY_DAYS,
    recommendedStayMax: VIETNAM_EVISA_STAY_DAYS,
    maxStayError:
      "The Vietnam e-Visa is issued for 30 days from your entry date — the return date is calculated automatically once you choose your travel start date.",
    leadTooSoonError:
      "Vietnam e-Visa processing takes about 4 business days, and weekends don't count — so your travel start date has to leave room for that. Pick a later date (the calendar already blocks the ones that are too soon).",
    // 0 = not applicable. The Vietnam e-Visa portal doesn't ask for proof of
    // funds, so no figure is shown for it.
    bankRecommendationKRW: 0,
    guidance:
      "Vitamin VisaAI prepares your application and submits it to the Vietnam Immigration Department through its official e-Visa portal. The process is entirely online — there is no embassy appointment. The e-Visa grants a 30-day stay from your chosen entry date, so your return date is set automatically. A decision normally takes about 3–4 business days.",
    processingText:
      "Fully electronic — no original passport is sent anywhere and no embassy visit is required. The e-Visa is issued by the Vietnam Immigration Department and sent to you as a PDF by email.",
    contacts: [],
    documents: [
      "Passport copy",
      "Korean ARC — front and back",
      "Recent photo 4 × 6 cm, white background",
      "Home-country family member's full name, phone and address",
      "Planned spending in Vietnam (USD)",
      "Who is financing the trip",
    ],
  },
};

// `rules` defaults to the code table; pass the DB-backed ruleset slice to
// override without affecting existing callers.
export function getDestinationRule(
  destination: string,
  rules: Record<string, DestinationRule> = DESTINATION_RULES
): DestinationRule | null {
  return rules[destination] ?? null;
}

// Format a Date as a local YYYY-MM-DD (matches <input type="date"> + parseISO).
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- Recommendations (auto-calculated, never enforced) ---------------------
export type Recommendation = {
  leadDays: number;
  stayMin: number;
  stayMax: number;
  maxStayDays: number;
  // Concrete suggested dates once the anchor (submission/appointment) is set.
  recommendedStartISO: string | null;
  recommendedEndISO: string | null;
};

export function getRecommendation(
  destination: string,
  anchorISO: string,
  rules: Record<string, DestinationRule> = DESTINATION_RULES
): Recommendation | null {
  const rule = getDestinationRule(destination, rules);
  if (!rule) return null;

  let recommendedStartISO: string | null = null;
  let recommendedEndISO: string | null = null;
  const anchor = parseISO(anchorISO);
  if (anchor) {
    const start = earliestTravelStart(rule, anchor);
    recommendedStartISO = toISO(start);
    recommendedEndISO = toISO(addDays(start, rule.recommendedStayMin - 1));
  }

  return {
    leadDays: rule.leadMinDays,
    stayMin: rule.recommendedStayMin,
    stayMax: rule.recommendedStayMax,
    maxStayDays: rule.maxStayDays,
    recommendedStartISO,
    recommendedEndISO,
  };
}

// Selectable window for the travel-start date picker (disabled dates outside).
// Returns null bounds when the anchor isn't set yet.
export function travelStartWindow(
  destination: string,
  anchorISO: string,
  rules: Record<string, DestinationRule> = DESTINATION_RULES
): { minISO: string | null; maxISO: string | null } {
  const rule = getDestinationRule(destination, rules);
  const anchor = parseISO(anchorISO);
  if (!rule || !anchor) return { minISO: null, maxISO: null };
  const min = earliestTravelStart(rule, anchor);
  const max =
    rule.leadMaxMonths != null
      ? addMonths(anchor, rule.leadMaxMonths)
      : addDays(anchor, rule.leadMaxDays ?? 90);
  return { minISO: toISO(min), maxISO: toISO(max) };
}

// --- Detailed, consultant-grade country guidance (shown in the modal) ------
// Each destination has bespoke copy — NOT a shared template — covering validity,
// stay, processing, the reasoning behind recommended dates, the risk of booking
// too close to submission, recommended duration, and important application notes.
export type CountryGuidance = {
  visaValidity: string;
  maxStay: string;
  processingTime: string;
  whyRecommendedDates: string;
  risksTooClose: string;
  recommendedDuration: string;
  importantNotes: string[];
};

export const COUNTRY_GUIDANCE: Record<string, CountryGuidance> = {
  Japan: {
    visaValidity:
      "Japan single-entry tourist visas are generally valid for 3 months from the date of issue. You must enter Japan within this validity window or the visa expires unused.",
    maxStay:
      "A short-term tourist stay is normally granted for up to 15 days per entry.",
    processingTime:
      "Processing usually takes about 5–7 business days after submission. Sticker-route applicants (Busan Consulate area) submit the original passport through a designated travel agency; e-Visa-route applicants do not send the original passport unless instructed.",
    whyRecommendedDates:
      "Because review takes several business days, we recommend setting your travel start date at least 8 days after the planned submission date. This leaves a safe margin so the visa is issued before you fly.",
    risksTooClose:
      "Booking your departure only a few days after submission risks the visa not being ready in time. This commonly forces expensive flight changes — and applications with unrealistic timelines may be returned or refused.",
    recommendedDuration:
      "Recommended stay is 4–5 days. The maximum stay used for application planning is 15 days.",
    importantNotes: [
      "Sticker-route applicants must hand in the original passport — plan for the days it is held by the consulate.",
      "A bank balance certificate of at least 5,000,000 KRW per applicant is recommended.",
      "Ensure flight reservations, hotel bookings, and supporting documents all match the travel dates entered here.",
      "Upload clear ARC front and back copies and a document matching your Korean visa status.",
    ],
  },

  Taiwan: {
    visaValidity:
      "Taiwan tourist visas are typically issued with a validity period of up to 3 months from the date of issue. Your trip must begin within this validity window.",
    maxStay:
      "Holders may normally stay in Taiwan for up to 14 days during the visa validity period.",
    processingTime:
      "Visa processing generally takes approximately 8–10 business days after submission, excluding weekends and public holidays.",
    whyRecommendedDates:
      "Because review takes 8–10 business days, applicants are strongly advised to select a travel start date at least 10 days after the planned submission date, so the visa office has enough time to process and issue the visa before departure.",
    risksTooClose:
      "If the travel date is too close to the submission date, the office may not have sufficient time to process the application before departure. Applications with unrealistic travel schedules may be delayed, returned for correction, or refused.",
    recommendedDuration:
      "Recommended stay is 4–5 days. The maximum stay used for application planning is 14 days.",
    importantNotes: [
      "Ensure your flight reservations, accommodation bookings, and supporting documents match the travel dates entered in this application.",
      "Taiwan has two mission offices in Korea — Seoul (main office) and Busan. Unlike Japan, there is no mandatory routing by region: you may choose to submit through either office regardless of where you live in Korea.",
      "Bank statement requirement differs by office: the Busan office only needs a 1-day bank balance certificate (min. 5,000,000 KRW). The Seoul office additionally requires a 3-month bank transaction history showing at least 5,000,000 KRW maintained for the last 10+ days, not just deposited right before applying.",
      "As a resident of Korea, your ARC is part of your supporting evidence — upload clear front and back copies.",
    ],
  },

  Singapore: {
    visaValidity:
      "Singapore visas are issued electronically with a defined entry validity stated on the visa; you must enter within that window.",
    maxStay:
      "This document service is planned around a maximum stay of 7 days.",
    processingTime:
      "Processing usually takes a few business days. Singapore accepts applications electronically and states there are no authorised visa agents in Korea — this platform only prepares your documents.",
    whyRecommendedDates:
      "We recommend a travel start date at least 8 days after the planned submission date, giving a comfortable buffer for issuance before you travel.",
    risksTooClose:
      "Choosing a departure date too soon after submission leaves no margin if additional checks are requested, which can cause delay or refusal and force you to rebook.",
    recommendedDuration:
      "Recommended stay is 4–5 days. The maximum stay used for application planning is 7 days.",
    importantNotes: [
      "Have proof of funds, return tickets, and hotel bookings that are consistent with your entered dates.",
      "Upload clear ARC front and back copies.",
      "Because there are no authorised agents, double-check every detail before submission.",
    ],
  },

  Spain: {
    visaValidity:
      "Spain (Schengen) short-stay visas are issued by the consulate and allow stays of up to 90 days within any 180-day period; your specific validity and dates are confirmed at the appointment.",
    maxStay:
      "This planning flow is built around a maximum stay of 12 days.",
    processingTime:
      "Schengen processing typically takes about 15 calendar days and can extend to 30–45 days in busy periods. An embassy appointment is required before you can submit.",
    whyRecommendedDates:
      "Because Schengen review is slower and appointment-based, we recommend a travel start date at least 22 days after your appointment date to allow safe time for review and document processing.",
    risksTooClose:
      "Schengen visas are frequently delayed. Booking travel too close to the appointment is the most common reason applicants miss their trip — always allow generous time.",
    recommendedDuration:
      "Recommended stay is 4–7 days. The maximum stay used for application planning is 12 days.",
    importantNotes: [
      "Secure your embassy appointment first — you cannot submit without one.",
      "Travel medical insurance covering the entire Schengen area is mandatory.",
      "Prepare proof of funds, accommodation, return flights, and proof of residence in Korea (ARC).",
    ],
  },

  Vietnam: {
    visaValidity:
      "Vietnam e-Visas are single-entry and valid for 30 days from the entry date you choose — there is no separate 90-day option in this flow.",
    maxStay:
      "This service is built around a fixed 30-day stay: your return date is set automatically to 29 days after your entry date, making 30 days in total including the day you arrive.",
    processingTime:
      "e-Visa processing usually takes about 3–4 business days after submission. There is no embassy appointment — everything is handled online and the approved e-Visa (PDF) arrives by email.",
    whyRecommendedDates:
      "Because processing takes a few business days, choose an entry date at least 4 days after your planned application date so the e-Visa is approved before you fly.",
    risksTooClose:
      "Applying too close to your travel date risks the e-Visa not arriving in time — there is no way to expedite or walk in, so build in a safe margin.",
    recommendedDuration:
      "The e-Visa is issued for 30 days; the return date is calculated automatically and cannot be extended within this flow.",
    importantNotes: [
      "Upload a recent photo, 4 × 6 cm, plain white background, taken within the last 6 months.",
      "Provide the full name, phone number and home address of a family member in your home country — Vietnam's e-Visa asks for this contact.",
      "State how much you plan to spend in Vietnam (USD) and who is financing the trip.",
      "Upload clear ARC front and back copies alongside your passport.",
    ],
  },
};

export function getCountryGuidance(
  destination: string,
  guidance: Record<string, CountryGuidance> = COUNTRY_GUIDANCE
): CountryGuidance | null {
  return guidance[destination] ?? null;
}

// --- Validation ------------------------------------------------------------
export type DateValidation = {
  ok: boolean;
  stayDays: number | null;
  errors: {
    anchor?: string;
    travel_start?: string;
    travel_end?: string;
    stay?: string;
  };
};

export function validateDates(
  destination: string,
  input: {
    planned_submission_date: string;
    travel_start_date: string;
    travel_end_date: string;
  },
  rules: Record<string, DestinationRule> = DESTINATION_RULES
): DateValidation {
  const rule = getDestinationRule(destination, rules);
  const errors: DateValidation["errors"] = {};
  if (!rule) return { ok: false, stayDays: null, errors: {} };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Anchor: required for most; Japan defaults to today if blank.
  let anchor = parseISO(input.planned_submission_date);
  if (!anchor) {
    if (rule.anchorRequired) {
      errors.anchor = `${rule.anchorLabel} is required.`;
    } else {
      anchor = today; // Japan default
    }
  }

  const start = parseISO(input.travel_start_date);
  const end = parseISO(input.travel_end_date);

  if (!start) errors.travel_start = "Enter a valid travel start date.";
  if (!end) errors.travel_end = "Enter a valid travel end date.";

  let stayDays: number | null = null;

  if (start && end) {
    if (end < start) {
      errors.travel_end = "Return date must be on or after the travel start date.";
    } else {
      stayDays = dayDiff(end, start) + 1; // inclusive
      if (stayDays < rule.minStayDays || stayDays > rule.maxStayDays) {
        errors.stay = rule.maxStayError;
      }
    }
  }

  if (anchor && start) {
    const minStart = earliestTravelStart(rule, anchor);
    const maxStart =
      rule.leadMaxMonths != null
        ? addMonths(anchor, rule.leadMaxMonths)
        : addDays(anchor, rule.leadMaxDays ?? 90);
    if (start < minStart) {
      errors.travel_start = rule.leadTooSoonError;
    } else if (start > maxStart) {
      const window =
        rule.leadMaxMonths != null
          ? `${rule.leadMaxMonths} months`
          : `${rule.leadMaxDays ?? 90} days`;
      errors.travel_start = `Please choose a travel start date within ${window} of your ${rule.anchorLabel.toLowerCase()}.`;
    }
  }

  return { ok: Object.keys(errors).length === 0, stayDays, errors };
}
