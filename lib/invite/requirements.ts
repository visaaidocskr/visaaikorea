// What the client must gather, by the inviter's Korean visa status.
//
// IMPORTANT — why most statuses are marked unverified:
//
// Korea does not publish a single list of "these residence statuses may
// invite a relative on C-3-1 and these may not". In practice the mission
// weighs the inviter's status stability, income and the relationship
// evidence, and the exact paper list differs between missions. We searched
// the immigration service, easylaw and several mission sites and could not
// find an authoritative list.
//
// So rather than invent plausible-looking checklists — the same rule that
// keeps blank fields blank everywhere else in this codebase — only D-2 is
// published here, because it comes from a real completed case. Every other
// status returns `verified: false`, and the UI tells the client we will
// confirm their exact list with them instead of showing them a guess.
//
// When a status is confirmed in practice, add it below with its source.

export type RequirementGroup = {
  title: string;
  items: string[];
  note?: string;
};

export type StatusRequirements = {
  /** false → we have not confirmed this status; show the fallback message. */
  verified: boolean;
  /** Where the list came from, so it can be re-checked later. */
  source?: string;
  /** Documents this site writes for the client. */
  generated: string[];
  /** Everything the client collects themselves. */
  groups: RequirementGroup[];
  notes: string[];
};

// The three documents we produce, one set per invited person.
const GENERATED_DOCS = [
  "초청장 — Invitation letter (one per invitee, signed by you)",
  "초청 사유서 — Statement of reasons for the invitation (one per invitee)",
  "신원보증서 — Guarantee letter, form 별지 제129호서식 (one per invitee)",
];

const D2: StatusRequirements = {
  verified: true,
  source:
    "Completed D-2 case, Embassy of the Republic of Korea in Uzbekistan (2026). Confirm before each new submission — missions change their lists.",
  generated: GENERATED_DOCS,
  groups: [
    {
      title: "You prepare in Korea",
      items: [
        "재학증명서 — Certificate of enrolment from your university",
        "성적증명서 — Academic transcript",
        "Proof that your tuition is paid",
        "Housing lease contract (임대차계약서)",
        "추천서 — Professor's recommendation letter (optional, but it helps)",
        "Bank certificate showing USD 10,000 (single-day balance)",
        "Copy of your ARC (alien registration card)",
        "Copy of your passport",
      ],
    },
    {
      title: "From your 주민센터 (community centre)",
      items: [
        "본인서명 사실확인서 — Certificate of your signature",
        "출입국에 관한 사실증명 — Record of your entries and exits",
        "외국인등록 사실증명 — Proof of alien registration",
      ],
    },
    {
      title: "Your relative prepares in Uzbekistan",
      items: [
        "Passport — original and a copy",
        "Certificate proving your relationship, translated (apostille not required)",
        "Personal identification certificate (PINFL) from my.gov.uz",
        "Single-day bank statement from an Uzbek bank — it must carry a QR code",
        "Copy of the ID card or biometric passport, on A4",
        "Two photographs, 3.5 × 4.5 cm",
      ],
    },
  ],
  notes: [
    "If the person applying has children travelling with them, a copy of each of these documents is needed for every child as well.",
    "The visa itself is applied for in Uzbekistan, through an agency accredited by the Korean embassy. We prepare the Korea-side paperwork; we do not submit the application.",
  ],
};

// Statuses we have not confirmed. Same object for all of them so the UI has
// one clear message rather than several half-guesses.
const UNVERIFIED: StatusRequirements = {
  verified: false,
  generated: GENERATED_DOCS,
  groups: [],
  notes: [
    "We have not yet confirmed the exact document list for this residence status, and we would rather tell you that than show you a guess.",
    "We still write your 초청장, 초청 사유서 and 신원보증서. After you submit, our team confirms the remaining list with the embassy and sends it to you.",
  ],
};

// Keyed by the code before the first space, so the display labels in
// lib/visa/config.ts can change without breaking this.
const BY_CODE: Record<string, StatusRequirements> = {
  "D-2": D2,
};

export function requirementsForStatus(status: string): StatusRequirements {
  const code = (status ?? "").trim().split(" ")[0];
  return BY_CODE[code] ?? UNVERIFIED;
}

export function isVerifiedStatus(status: string): boolean {
  return requirementsForStatus(status).verified;
}
