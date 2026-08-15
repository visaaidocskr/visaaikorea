// Maps a stored application + applicant_details (+ accommodations) into the
// TaiwanVisaData shape consumed by components/forms/TaiwanVisaForm.tsx.
// Mirrors lib/docs/japanData.ts's structure and "never fabricate" rules.
import type { TaiwanVisaData } from "@/components/forms/TaiwanVisaForm";

// Permissive row shapes — there are no generated DB types yet.
export type TaiwanAppRow = {
  nationality: string | null;
  travel_start_date: string | null;
  travel_end_date?: string | null;
  planned_submission_date?: string | null;
  current_korea_address: string | null;
  client_phone: string | null;
  client_email?: string | null;
  taiwan_travel_purpose?: string | null;
  taiwan_travel_purpose_other?: string | null;
  // The 8 page-2 Yes/No declarations — applicant-answered only, null until
  // answered. Never fabricated/defaulted.
  taiwan_background_answers?: {
    criminalRecord?: boolean | null;
    illegalEntry?: boolean | null;
    communicableDisease?: boolean | null;
    overstayedOrIllegalWork?: boolean | null;
    drugTrafficking?: boolean | null;
    visaRefused?: boolean | null;
    differentName?: boolean | null;
    workedInTaiwan?: boolean | null;
  } | null;
};

export type TaiwanDetailRow = {
  surname: string | null;
  given_name: string | null;
  middle_name_or_patronymic?: string | null;
  other_names?: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  nationality: string | null;
  former_nationality?: string | null;
  country_of_birth: string | null;
  birth_city?: string | null;
  passport_number: string | null;
  passport_type?: string | null;
  passport_place_of_issue?: string | null;
  passport_issue_date: string | null;
  passport_expiry_date: string | null;
  occupation: string | null;
  employer_or_school_name: string | null;
  home_country_address?: string | null;
  home_country_phone?: string | null;
} | null;

export type TaiwanAccommodationRow = {
  name: string | null;
  address: string | null;
  phone: string | null;
};

function s(v: string | null | undefined): string {
  return (v ?? "").trim();
}

/** ISO date (yyyy-mm-dd) -> yyyy/mm/dd to match Taiwan's form date convention. */
function fmtDate(v: string | null | undefined): string {
  const raw = s(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  return m ? `${m[1]}/${m[2]}/${m[3]}` : raw;
}

function asSex(v: string | null | undefined): "male" | "female" | "" {
  const t = s(v).toLowerCase();
  if (!t) return "";
  return t.startsWith("f") ? "female" : "male";
}

function asMarital(v: string | null | undefined): TaiwanVisaData["maritalStatus"] {
  const t = s(v).toLowerCase();
  if (t.startsWith("marr")) return "married";
  if (t.startsWith("wid")) return "widowed";
  if (t.startsWith("sep")) return "separated";
  if (t.startsWith("div")) return "divorced";
  if (t === "single" || t === "") return t === "single" ? "single" : "";
  return "other";
}

function asPassportType(v: string | null | undefined): TaiwanVisaData["passportType"] {
  const t = s(v).toLowerCase();
  if (t.startsWith("dip")) return "diplomatic";
  if (t.startsWith("off")) return "official";
  if (t.startsWith("oth")) return "other";
  return "regular"; // "ordinary" in our shared enum -> "Regular" on Taiwan's form
}

function asPurpose(v: string | null | undefined): TaiwanVisaData["purposeOfTravel"] {
  const allowed = [
    "tourism",
    "business",
    "study",
    "employment",
    "family",
    "religion",
    "entrepreneur",
    "other",
  ] as const;
  const t = s(v).toLowerCase();
  return (allowed as readonly string[]).includes(t) ? (t as TaiwanVisaData["purposeOfTravel"]) : "";
}

// Uzbek (and other patronymic-using) applicants have no dedicated slot for the
// patronymic on Taiwan's form — the closest real field is "Former or other
// name(s)" (field 4). Fall back to other_names if there's no patronymic. Never
// invents a value when both are empty.
function formerOrOtherName(d: TaiwanDetailRow): string {
  const patronymic = s(d?.middle_name_or_patronymic);
  if (patronymic) return patronymic;
  return s(d?.other_names);
}

export function toTaiwanVisaData(bundle: {
  application: TaiwanAppRow;
  details: TaiwanDetailRow;
  accommodations?: TaiwanAccommodationRow[];
}): TaiwanVisaData {
  const a = bundle.application;
  const d = bundle.details;
  const firstHotel = (bundle.accommodations ?? [])[0] ?? null;

  return {
    surname: s(d?.surname),
    givenName: s(d?.given_name),
    formerOrOtherName: formerOrOtherName(d),
    nationality: (s(a.nationality) || s(d?.nationality)).toUpperCase(),
    formerNationality: s(d?.former_nationality),
    sex: asSex(d?.gender),
    maritalStatus: asMarital(d?.marital_status),
    dateOfBirth: fmtDate(d?.date_of_birth),
    birthCity: s(d?.birth_city),
    birthCountry: s(d?.country_of_birth),
    occupation: s(d?.occupation),
    institutionName: s(d?.employer_or_school_name),

    taiwanAddress: s(firstHotel?.name)
      ? [s(firstHotel?.name), s(firstHotel?.address)].filter(Boolean).join(" — ")
      : s(firstHotel?.address),
    taiwanPhone: s(firstHotel?.phone),

    homeAddress: s(d?.home_country_address),
    homePhone: s(d?.home_country_phone),

    passportType: asPassportType(d?.passport_type),
    passportNumber: s(d?.passport_number),
    passportIssuePlace: s(d?.passport_place_of_issue),
    passportIssueDate: fmtDate(d?.passport_issue_date),
    passportExpiryDate: fmtDate(d?.passport_expiry_date),

    purposeOfTravel: asPurpose(a.taiwan_travel_purpose),
    purposeOfTravelOther: s(a.taiwan_travel_purpose_other),
    arrivalDate: fmtDate(a.travel_start_date),
    departureDate: fmtDate(a.travel_end_date),

    email: s(a.client_email),
    applicationDate: fmtDate(new Date().toISOString().slice(0, 10)),

    backgroundAnswers: {
      criminalRecord: a.taiwan_background_answers?.criminalRecord ?? null,
      illegalEntry: a.taiwan_background_answers?.illegalEntry ?? null,
      communicableDisease: a.taiwan_background_answers?.communicableDisease ?? null,
      overstayedOrIllegalWork: a.taiwan_background_answers?.overstayedOrIllegalWork ?? null,
      drugTrafficking: a.taiwan_background_answers?.drugTrafficking ?? null,
      visaRefused: a.taiwan_background_answers?.visaRefused ?? null,
      differentName: a.taiwan_background_answers?.differentName ?? null,
      workedInTaiwan: a.taiwan_background_answers?.workedInTaiwan ?? null,
    },
  };
}

// --- Document-data mapping layer --------------------------------------------
// Fields required for a faithful, complete application form. We never
// generate the document with fabricated/missing data — instead, generation is
// refused and the exact missing fields are reported ("Needs attention").
export type TaiwanDocumentData = {
  visa: TaiwanVisaData;
  needsAttention: string[];
};

const REQUIRED_FIELDS: { key: keyof TaiwanVisaData; label: string }[] = [
  { key: "surname", label: "Surname" },
  { key: "givenName", label: "Given name" },
  { key: "nationality", label: "Nationality" },
  { key: "sex", label: "Sex" },
  { key: "maritalStatus", label: "Marital status" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "birthCity", label: "Place of birth (city)" },
  { key: "birthCountry", label: "Place of birth (country)" },
  { key: "passportType", label: "Passport type" },
  { key: "passportNumber", label: "Passport number" },
  { key: "passportIssuePlace", label: "Passport place of issue" },
  { key: "passportIssueDate", label: "Passport date of issue" },
  { key: "passportExpiryDate", label: "Passport date of expiry" },
  { key: "purposeOfTravel", label: "Purpose of travel" },
  { key: "arrivalDate", label: "Propose date of arrival" },
  { key: "departureDate", label: "Propose date of departure" },
  { key: "homeAddress", label: "Home-country address" },
];

export function getTaiwanDocumentData(bundle: {
  application: TaiwanAppRow;
  details: TaiwanDetailRow;
  accommodations?: TaiwanAccommodationRow[];
}): TaiwanDocumentData {
  const visa = toTaiwanVisaData(bundle);
  const needsAttention: string[] = [];

  for (const f of REQUIRED_FIELDS) {
    if (String(visa[f.key] ?? "").trim() === "") needsAttention.push(f.label);
  }
  if (!visa.taiwanAddress) needsAttention.push("Confirmed accommodation in Taiwan");

  return { visa, needsAttention };
}
