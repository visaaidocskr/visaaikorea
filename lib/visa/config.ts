// Central, typed visa configuration. In Phase 3 these defaults will be
// overridable from the admin "rules" tables; for now they are the source of
// truth that the wizard and server validation both read.
import type {
  DocumentRequirement,
  PatronymicRule,
} from "@/lib/visa/types";

// --- Destinations + cities -------------------------------------------------
export const DESTINATIONS = ["Japan", "Taiwan", "Singapore", "Spain"] as const;

export const DESTINATION_CITIES: Record<string, string[]> = {
  Japan: ["Tokyo", "Osaka", "Fukuoka"],
  Taiwan: ["Taipei"],
  Singapore: ["Singapore"],
  Spain: ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Other"],
};

// --- Nationalities (form dropdown) ----------------------------------------
export const NATIONALITIES = [
  "Uzbekistan",
  "Kazakhstan",
  "Kyrgyzstan",
  "Russia",
  "Tajikistan",
  "China",
  "Vietnam",
  "Thailand",
  "Philippines",
  "Indonesia",
  "Taiwan",
  "Mongolia",
  "Nepal",
  "Cambodia",
  "Bangladesh",
  "Pakistan",
  "India",
  "Sri Lanka",
  "Myanmar",
] as const;

// --- Patronymic / middle-name rule by nationality -------------------------
// Uzbekistan: required (passports commonly include the father's name).
// Other post-Soviet states: shown but optional unless an admin rule overrides.
// Everyone else: optional.
const PATRONYMIC_REQUIRED = ["Uzbekistan"];
const PATRONYMIC_OPTIONAL_VISIBLE = [
  "Kazakhstan",
  "Kyrgyzstan",
  "Tajikistan",
  "Russia",
];

// Resolve the patronymic rule for a nationality. Pass a precomputed `overrides`
// map (e.g. from the DB-backed ruleset) to override the built-in defaults; when
// omitted, the original code defaults apply unchanged.
export function patronymicRule(
  nationality: string,
  overrides?: Record<string, PatronymicRule>
): PatronymicRule {
  if (overrides) return overrides[nationality] ?? "optional";
  if (PATRONYMIC_REQUIRED.includes(nationality)) return "required";
  if (PATRONYMIC_OPTIONAL_VISIBLE.includes(nationality)) return "optional";
  return "optional"; // visible but optional for all others
}

// --- Korean visa statuses --------------------------------------------------
export const KOREAN_VISA_STATUSES = [
  "D-2 Student",
  "D-4 Language Student",
  "D-7 Intra-company Transfer",
  "D-8 Business Investment",
  "D-9 International Trade",
  "D-10 Job Seeking",
  "E-1 Professor",
  "E-2 Foreign Language Instructor",
  "E-3 Research",
  "E-4 Technology Transfer",
  "E-5 Professional Employment",
  "E-6 Culture/Entertainment",
  "E-7 Specially Designated Activities",
  "E-8 Seasonal Worker",
  "E-9 Non-professional Employment",
  "E-10 Ship Crew",
  "F-1 Visiting/Joining Family",
  "F-2 Residence",
  "F-3 Dependent Family",
  "F-4 Overseas Korean",
  "F-5 Permanent Resident",
  "F-6 Marriage Migrant",
  "G-1 Miscellaneous",
] as const;

// Documents every applicant uploads, regardless of visa status.
export const BASE_DOCUMENTS: DocumentRequirement[] = [
  { key: "passport", labelEn: "Passport copy", required: true },
  { key: "arc_front", labelEn: "ARC — front side", required: true },
  { key: "arc_back", labelEn: "ARC — back side", required: true },
];

// Status-specific documents. The status key is matched by its code prefix
// (the text before the first space), so labels can evolve without breaking.
export const STATUS_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  "D-2": [
    {
      key: "enrollment_certificate",
      labelEn: "Enrollment Certificate",
      labelKo: "재학증명서",
      required: true,
      hint: "Official enrollment certificate issued by your school/university.",
    },
  ],
  "D-4": [
    {
      key: "enrollment_certificate",
      labelEn: "Enrollment Certificate",
      labelKo: "재학증명서",
      required: true,
      hint: "Official enrollment certificate issued by your language institute.",
    },
  ],
  "D-10": [
    {
      key: "graduation_certificate",
      labelEn: "Graduation Certificate",
      labelKo: "졸업증명서",
      required: true,
    },
    {
      key: "job_seeking_proof",
      labelEn: "Job-seeking activity proof",
      labelKo: "구직활동 증빙자료",
      required: false,
    },
  ],
  "D-8": [
    {
      key: "business_registration",
      labelEn: "Business Registration Certificate",
      labelKo: "사업자등록증명",
      required: true,
    },
    { key: "income_tax_document", labelEn: "Income / tax document", required: false },
  ],
  "D-9": [
    {
      key: "business_registration",
      labelEn: "Business Registration Certificate",
      labelKo: "사업자등록증명",
      required: true,
    },
    { key: "income_tax_document", labelEn: "Income / tax document", required: false },
  ],
  "D-7": eSeriesDocs(),
  "E-1": eSeriesDocs(),
  "E-2": eSeriesDocs(),
  "E-3": eSeriesDocs(),
  "E-4": eSeriesDocs(),
  "E-5": eSeriesDocs(),
  "E-6": eSeriesDocs(),
  "E-7": eSeriesDocs(),
  "E-8": laborDocs(),
  "E-9": laborDocs(),
  "E-10": [
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate",
      labelKo: "재직증명서",
      required: true,
    },
    {
      key: "crew_confirmation",
      labelEn: "Crew Confirmation",
      labelKo: "승선확인서",
      required: false,
    },
  ],
  "F-2": [
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate (if employed)",
      labelKo: "재직증명서",
      required: false,
    },
    {
      key: "income_certificate",
      labelEn: "Income Certificate / financial proof",
      labelKo: "소득금액증명원",
      required: false,
    },
  ],
  "F-5": [
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate (if employed)",
      labelKo: "재직증명서",
      required: false,
    },
    {
      key: "income_certificate",
      labelEn: "Income Certificate / financial proof",
      labelKo: "소득금액증명원",
      required: false,
    },
  ],
  "F-1": [
    {
      key: "family_relationship",
      labelEn: "Family Relationship Certificate",
      labelKo: "가족관계증명서",
      required: false,
    },
  ],
  "F-3": [
    {
      key: "family_relationship",
      labelEn: "Family Relationship Certificate",
      labelKo: "가족관계증명서",
      required: false,
    },
  ],
  // F-6 (Marriage Migrant) holders vary widely — some study, some work, some
  // run a business, and some do none of these. All three proof documents are
  // offered as optional; the applicant provides whichever applies. The
  // marriage certificate's `required` flag is overridden dynamically in
  // documentsForStatus() below, based on the applicant's actual marital
  // status — required when married, optional otherwise.
  "F-6": [
    {
      key: "marriage_certificate",
      labelEn: "Marriage Certificate",
      labelKo: "혼인관계증명서",
      required: false,
    },
    {
      key: "family_relationship",
      labelEn: "Family Relationship Certificate",
      labelKo: "가족관계증명서",
      required: false,
    },
    {
      key: "enrollment_certificate",
      labelEn: "Enrollment Certificate (if studying)",
      labelKo: "재학증명서",
      required: false,
    },
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate (if employed)",
      labelKo: "재직증명서",
      required: false,
    },
    {
      key: "business_registration",
      labelEn: "Business Registration Certificate (if self-employed)",
      labelKo: "사업자등록증",
      required: false,
    },
  ],
  "F-4": [
    {
      key: "overseas_korean_proof",
      labelEn: "Overseas Korean status proof",
      required: false,
    },
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate (if employed)",
      labelKo: "재직증명서",
      required: false,
    },
  ],
  "G-1": [
    {
      key: "g1_reason_document",
      labelEn: "Reason / explanation document",
      labelKo: "체류자격 관련 소명자료",
      required: true,
      hint: "G-1 cases may require extra review. Provide a clear explanation document.",
    },
  ],
};

function eSeriesDocs(): DocumentRequirement[] {
  return [
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate",
      labelKo: "재직증명서",
      required: true,
    },
    {
      key: "employment_contract",
      labelEn: "Employment Contract",
      labelKo: "근로계약서",
      required: false,
    },
    {
      key: "business_registration",
      labelEn: "Company Business Registration Certificate",
      labelKo: "사업자등록증",
      required: false,
    },
    { key: "income_certificate", labelEn: "Income certificate (if available)", required: false },
  ];
}

function laborDocs(): DocumentRequirement[] {
  return [
    {
      key: "employment_certificate",
      labelEn: "Employment Certificate",
      labelKo: "재직증명서",
      required: true,
    },
    {
      key: "employment_contract",
      labelEn: "Employment Contract",
      labelKo: "근로계약서",
      required: true,
    },
  ];
}

// Returns the code prefix, e.g. "D-2 Student" -> "D-2".
export function visaStatusCode(status: string): string {
  return status.split(" ")[0] ?? "";
}

// Full document checklist for a given Korean visa status (base + specific).
// `base`/`statusDocs` default to the code tables; pass the DB-backed ruleset
// slices to override without changing behavior for existing callers.
//
// `maritalStatus` (optional, e.g. applicant_details.marital_status) refines
// F-6's marriage certificate: required when married, optional otherwise —
// this is the one document whose necessity depends on more than the visa
// status code alone, so it can't be a static table entry.
export function documentsForStatus(
  status: string,
  base: DocumentRequirement[] = BASE_DOCUMENTS,
  statusDocs: Record<string, DocumentRequirement[]> = STATUS_DOCUMENTS,
  maritalStatus?: string
): DocumentRequirement[] {
  const code = visaStatusCode(status);
  const docs = [...base, ...(statusDocs[code] ?? [])];
  if (code !== "F-6") return docs;
  const married = (maritalStatus ?? "").trim().toLowerCase() === "married";
  return docs.map((d) =>
    d.key === "marriage_certificate"
      ? {
          ...d,
          required: married,
          labelEn: married ? "Marriage Certificate" : "Marriage Certificate (if married)",
        }
      : d
  );
}

// D-10 asks extra narrative questions.
export function isJobSeeking(status: string): boolean {
  return visaStatusCode(status) === "D-10";
}
