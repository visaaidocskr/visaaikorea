// Centralized visa eligibility engine. Pure + isomorphic so the client wizard
// and (future) server validation both read the same source of truth.
//
// Given a (nationality, destination) pair it answers ONE question:
//   Does this traveller need a visa, an e-Visa, or nothing at all?
//
// Adding a new country or nationality is intentionally a data edit only — add a
// row to DESTINATION_ELIGIBILITY[destination].byNationality (or a new
// destination key). No wizard code needs to change.

export type VisaOutcome = "visa_free" | "evisa" | "visa_required";

// A single eligibility rule. Only `outcome` is required; everything else has a
// sensible generated default so most rows can stay terse.
export type EligibilityRule = {
  outcome: VisaOutcome;
  // Max tourist stay per entry, in days. Required for visa_free/evisa so we can
  // tell the user how long they may stay; optional for visa_required.
  maxStayDays?: number;
  // Optional copy overrides — when omitted, sensible defaults are generated.
  entryConditions?: string[];
  travelGuidance?: string[];
  note?: string;
};

export type DestinationEligibility = {
  // Applied when a nationality has no explicit rule for this destination.
  default: EligibilityRule;
  byNationality: Record<string, EligibilityRule>;
};

// The fully-resolved answer the UI renders.
export type EligibilityResult = {
  outcome: VisaOutcome;
  nationality: string;
  destination: string;
  maxStayDays: number | null;
  summary: string;
  entryConditions: string[];
  travelGuidance: string[];
  note?: string;
};

// --- Demonyms --------------------------------------------------------------
// Used to phrase the summary naturally ("Taiwanese citizens may enter Japan…").
export const DEMONYMS: Record<string, string> = {
  Uzbekistan: "Uzbekistani",
  Kazakhstan: "Kazakhstani",
  Kyrgyzstan: "Kyrgyz",
  Russia: "Russian",
  Tajikistan: "Tajikistani",
  China: "Chinese",
  Vietnam: "Vietnamese",
  Thailand: "Thai",
  Philippines: "Filipino",
  Indonesia: "Indonesian",
  Taiwan: "Taiwanese",
  Mongolia: "Mongolian",
  Nepal: "Nepali",
  Cambodia: "Cambodian",
  Bangladesh: "Bangladeshi",
  Pakistan: "Pakistani",
  India: "Indian",
  "Sri Lanka": "Sri Lankan",
  Myanmar: "Myanmar",
};

export function demonym(nationality: string): string {
  return DEMONYMS[nationality] ?? nationality;
}

// --- The eligibility matrix ------------------------------------------------
// Tourism-passport rules verified against June 2026 sources (official ICA /
// embassy / visa-policy references). Two assumptions specific to this platform:
//   1. Applicants are foreign residents of Korea who hold a valid ARC. This
//      matters for Taiwan's Travel Authorization Certificate, which accepts a
//      Korean resident certificate as the qualifying document.
//   2. Rules cover ordinary passports for tourism only.
// They are a maintainable starting point, not legal advice — admins can refine
// per country. Anything not listed falls back to the destination `default`.
const VR: EligibilityRule = { outcome: "visa_required" };

export const DESTINATION_ELIGIBILITY: Record<string, DestinationEligibility> = {
  // Japan — verified against Visa policy of Japan (2026).
  Japan: {
    default: VR,
    byNationality: {
      Taiwan: { outcome: "visa_free", maxStayDays: 90 },
      Thailand: { outcome: "visa_free", maxStayDays: 15 },
      Indonesia: {
        outcome: "evisa",
        maxStayDays: 15,
        note: "Indonesian biometric-passport holders must pre-register for the visa waiver online (or at a Japanese mission) before travel.",
      },
    },
  },

  // Taiwan — verified against Visa policy of Taiwan (2026). Thailand &
  // Philippines visa-free is a trial currently extended to 31 July 2026.
  // Vietnam/Indonesia/India/Cambodia/Myanmar qualify for the online Travel
  // Authorization Certificate because our applicants hold a Korean ARC.
  Taiwan: {
    default: VR,
    byNationality: {
      Thailand: {
        outcome: "visa_free",
        maxStayDays: 14,
        note: "Visa-exemption trial — currently extended to 31 July 2026.",
      },
      Philippines: {
        outcome: "visa_free",
        maxStayDays: 14,
        note: "Visa-exemption trial — currently extended to 31 July 2026.",
      },
      Vietnam: { outcome: "evisa", maxStayDays: 14, note: TAIWAN_TAC_NOTE() },
      Indonesia: { outcome: "evisa", maxStayDays: 14, note: TAIWAN_TAC_NOTE() },
      India: { outcome: "evisa", maxStayDays: 14, note: TAIWAN_TAC_NOTE() },
      Cambodia: { outcome: "evisa", maxStayDays: 14, note: TAIWAN_TAC_NOTE() },
      Myanmar: { outcome: "evisa", maxStayDays: 14, note: TAIWAN_TAC_NOTE() },
    },
  },

  // Singapore — verified against ICA visa requirements (2026). CIS states
  // (Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan, Russia) and Bangladesh /
  // Pakistan need a visa; China is visa-free since the 9 Feb 2024 mutual
  // exemption; India uses the e-visa.
  Singapore: {
    default: VR,
    byNationality: {
      China: {
        outcome: "visa_free",
        maxStayDays: 30,
        note: "Mutual 30-day visa exemption with Singapore, in force since 9 February 2024.",
      },
      Taiwan: { outcome: "visa_free", maxStayDays: 30 },
      Thailand: { outcome: "visa_free", maxStayDays: 30 },
      Vietnam: { outcome: "visa_free", maxStayDays: 30 },
      Philippines: { outcome: "visa_free", maxStayDays: 30 },
      Indonesia: { outcome: "visa_free", maxStayDays: 30 },
      Mongolia: { outcome: "visa_free", maxStayDays: 30 },
      Nepal: { outcome: "visa_free", maxStayDays: 30 },
      Cambodia: { outcome: "visa_free", maxStayDays: 30 },
      "Sri Lanka": { outcome: "visa_free", maxStayDays: 30 },
      Myanmar: { outcome: "visa_free", maxStayDays: 30 },
      India: { outcome: "evisa", maxStayDays: 30 },
    },
  },

  // Schengen short-stay: every nationality in our list needs a visa.
  Spain: {
    default: { outcome: "visa_required", maxStayDays: 90 },
    byNationality: {},
  },

  // Vietnam — verified against Vietnam's unilateral visa-exemption list and
  // e-Visa policy (2026). Since 2023 the e-Visa is open to every nationality,
  // so anyone not on the exemption list below falls through to the `default`
  // e-Visa outcome — there is no "visa_required only" case for Vietnam.
  Vietnam: {
    default: { outcome: "evisa", maxStayDays: 30 },
    byNationality: {
      Russia: {
        outcome: "visa_free",
        maxStayDays: 45,
        note: "Unilateral visa exemption, extended through 14 August 2028.",
      },
      Thailand: { outcome: "visa_free", maxStayDays: 30 },
      Indonesia: { outcome: "visa_free", maxStayDays: 30 },
      Cambodia: { outcome: "visa_free", maxStayDays: 30 },
      Myanmar: { outcome: "visa_free", maxStayDays: 30 },
      Philippines: { outcome: "visa_free", maxStayDays: 21 },
    },
  },
};

// Shared note for Taiwan's Travel Authorization Certificate route.
function TAIWAN_TAC_NOTE(): string {
  return "Eligible for Taiwan's online Travel Authorization Certificate because you hold a valid Korean resident card (ARC).";
}

// --- Default copy generators ----------------------------------------------
function defaultSummary(
  outcome: VisaOutcome,
  who: string,
  destination: string,
  maxStayDays: number | null
): string {
  const stay = maxStayDays ? ` for up to ${maxStayDays} days` : "";
  switch (outcome) {
    case "visa_free":
      return `${who} citizens may enter ${destination} visa-free for tourism${stay}.`;
    case "evisa":
      return `${who} citizens are eligible for an electronic visa (e-Visa) to visit ${destination}${stay}.`;
    case "visa_required":
      return `${who} citizens need a tourist visa to visit ${destination}.`;
  }
}

function defaultEntryConditions(
  outcome: VisaOutcome,
  destination: string,
  maxStayDays: number | null
): string[] {
  const stayLine = maxStayDays
    ? `Stay limited to ${maxStayDays} days per entry`
    : "Stay limited to the period granted on entry";
  const common = [
    "Passport valid for at least 6 months beyond travel",
    "Proof of onward or return travel",
    "Sufficient funds for the duration of your stay",
  ];
  switch (outcome) {
    case "visa_free":
      return [stayLine, ...common];
    case "evisa":
      return [
        "Approved e-Visa obtained online before departure",
        stayLine,
        ...common,
      ];
    case "visa_required":
      return [
        `A valid ${destination} tourist visa in your passport`,
        ...common,
      ];
  }
}

function defaultTravelGuidance(
  outcome: VisaOutcome,
  destination: string
): string[] {
  switch (outcome) {
    case "visa_free":
      return [
        `No visa application is needed for a tourist trip to ${destination}.`,
        "Carry proof of accommodation and return tickets — border officers may ask.",
        "Confirm the latest rules before you fly, as policies can change.",
      ];
    case "evisa":
      return [
        `Apply for your ${destination} e-Visa online and travel once it is approved.`,
        "Keep a printed or digital copy of the approval with you.",
      ];
    case "visa_required":
      return [
        `Prepare your full document package for the ${destination} tourist visa below.`,
        "We will guide you through every required document step by step.",
      ];
  }
}

// --- The engine ------------------------------------------------------------
export function evaluateEligibility(
  nationality: string,
  destination: string,
  matrix: Record<string, DestinationEligibility> = DESTINATION_ELIGIBILITY,
  demonyms: Record<string, string> = DEMONYMS
): EligibilityResult | null {
  if (!nationality || !destination) return null;
  const who = demonyms[nationality] ?? nationality;

  // Same country/territory: a citizen entering home is never a visa case.
  // Checked before the destination matrix so it applies to every destination.
  // Reported as visa_free so the existing no-application path handles it.
  if (nationality === destination) {
    return {
      outcome: "visa_free",
      nationality,
      destination,
      maxStayDays: null,
      summary: `${who} citizens do not require a visa to enter their own country/territory.`,
      entryConditions: [
        `A valid ${destination} passport or national identity document`,
        "No visa required and no maximum stay as a citizen",
      ],
      travelGuidance: [
        `As a citizen of ${destination}, you have the right to enter and stay without a visa.`,
      ],
    };
  }

  const dest = matrix[destination];
  if (!dest) return null;

  const rule = dest.byNationality[nationality] ?? dest.default;
  const maxStayDays = rule.maxStayDays ?? null;

  return {
    outcome: rule.outcome,
    nationality,
    destination,
    maxStayDays,
    summary: defaultSummary(rule.outcome, who, destination, maxStayDays),
    entryConditions:
      rule.entryConditions ??
      defaultEntryConditions(rule.outcome, destination, maxStayDays),
    travelGuidance:
      rule.travelGuidance ?? defaultTravelGuidance(rule.outcome, destination),
    note: rule.note,
  };
}

// Does this outcome require going through the visa application workflow?
export function requiresApplication(outcome: VisaOutcome): boolean {
  return outcome !== "visa_free";
}

// The ordered step labels the wizard should present for an outcome. `null`
// (eligibility not yet determined) shows just the Destination step.
export function stepsForOutcome(outcome: VisaOutcome | null): string[] {
  switch (outcome) {
    case "visa_free":
      return ["Destination", "Result"];
    case "evisa":
      return ["Destination", "Applicant", "Guidance"];
    case "visa_required":
      return ["Destination", "Applicant", "Companions", "Guidance"];
    default:
      return ["Destination"];
  }
}
