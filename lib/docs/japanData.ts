// Maps a stored application + applicant_details (+ Japan child records) into the
// JapanVisaData shape consumed by components/forms/JapanVisaForm.tsx.
import type { JapanVisaData } from "@/components/forms/JapanVisaForm";

// Permissive row shapes — there are no generated DB types yet.
export type JapanAppRow = {
  nationality: string | null;
  travel_purpose: string | null;
  travel_start_date: string | null;
  travel_end_date?: string | null;
  stay_days: number | null;
  current_korea_address: string | null;
  client_phone: string | null;
  port_of_entry?: string | null;
  korean_visa_status?: string | null;
  flight_booked?: boolean | null;
  accommodation_booked?: boolean | null;
  city_region_detected?: string | null;
  // eVisa Personal-Information form only:
  client_email?: string | null;
  // The 6 page-2 Yes/No background declarations — applicant-answered only,
  // null until answered. Never fabricated/defaulted.
  background_answers?: {
    crime?: boolean | null;
    imprisonment?: boolean | null;
    drugs?: boolean | null;
    deported?: boolean | null;
    prostitution?: boolean | null;
    trafficking?: boolean | null;
  } | null;
  remarks?: string | null;
};

// D-2/D-4 holders are students; the form's occupation reads "Student" rather
// than a job position (which we no longer collect for students).
function isStudentStatus(status: string | null | undefined): boolean {
  const code = (status ?? "").trim().split(" ")[0];
  return code === "D-2" || code === "D-4";
}

export type JapanDetailRow = {
  surname: string | null;
  given_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  nationality: string | null;
  country_of_birth: string | null;
  passport_number: string | null;
  passport_issue_date: string | null;
  passport_expiry_date: string | null;
  occupation: string | null;
  employer_or_school_name: string | null;
  employer_or_school_address: string | null;
  korean_arc_number: string | null;
  // For Uzbek (and other patronymic-using) nationals: the passport's second
  // name line ("Father's name / Patronymic" in PersonalStep.tsx). Printed
  // right after the given name, matching how it appears on the passport.
  middle_name_or_patronymic?: string | null;
  // 0006 additions
  other_names?: string | null;
  former_nationality?: string | null;
  birth_city?: string | null;
  birth_state?: string | null;
  passport_type?: string | null;
  passport_place_of_issue?: string | null;
  passport_issuing_authority?: string | null;
  home_government_id?: string | null;
  mobile?: string | null;
  position_title?: string | null;
  employer_phone?: string | null;
} | null;

export type JapanFlightRow = {
  airline: string | null;
  flight_number: string | null;
} | null;

export type JapanAccommodationRow = {
  name: string | null;
  address: string | null;
  phone: string | null;
};

export type JapanVisitRow = {
  visited_from: string | null;
  visited_to: string | null;
  duration_note: string | null;
};

export type JapanHostRow = {
  name: string | null;
  address: string | null;
  phone: string | null;
  date_of_birth: string | null;
  sex: string | null;
  relationship: string | null;
  occupation: string | null;
  nationality: string | null;
  immigration_status: string | null;
  // "inviter" | "guarantor" — which box on the form this person's details go
  // into. Set by HostStep.tsx when the applicant picks a host type.
  role?: string | null;
} | null;

function s(v: string | null | undefined): string {
  return (v ?? "").trim();
}

/** ISO date (yyyy-mm-dd) -> dd/mm/yyyy to match the form's date hint. */
function fmtDate(v: string | null | undefined): string {
  const raw = s(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
}

function asSex(v: string | null | undefined): "male" | "female" {
  return s(v).toLowerCase().startsWith("f") ? "female" : "male";
}

/** Like asSex, but stays "" (unchecked on the form) when nothing was entered —
 * used for the guarantor, where "no value" means "no guarantor selected", not
 * a default sex. */
function asSexOrEmpty(v: string | null | undefined): "male" | "female" | "" {
  const t = s(v).toLowerCase();
  if (!t) return "";
  return t.startsWith("f") ? "female" : "male";
}

function asMarital(v: string | null | undefined): JapanVisaData["maritalStatus"] {
  const t = s(v).toLowerCase();
  if (t.startsWith("marr")) return "married";
  if (t.startsWith("wid")) return "widowed";
  if (t.startsWith("div")) return "divorced";
  return "single";
}

function asPassportType(v: string | null | undefined): JapanVisaData["passportType"] {
  const t = s(v).toLowerCase();
  if (t.startsWith("dip")) return "diplomatic";
  if (t.startsWith("off")) return "official";
  if (t.startsWith("oth")) return "other";
  return "ordinary";
}

/** Combine "occupation" + "position" into the form's single field. */
function joinParts(...parts: (string | null | undefined)[]): string {
  return parts.map(s).filter(Boolean).join(", ");
}

export function toJapanVisaData(bundle: {
  application: JapanAppRow;
  details: JapanDetailRow;
  flight?: JapanFlightRow;
  accommodations?: JapanAccommodationRow[];
  previousVisits?: JapanVisitRow[];
  host?: JapanHostRow;
}): JapanVisaData {
  const a = bundle.application;
  const d = bundle.details;
  const flight = bundle.flight ?? null;
  const firstHotel = (bundle.accommodations ?? [])[0] ?? null;
  const host = bundle.host ?? null;

  // A single host record is collected (HostStep.tsx), tagged with which box on
  // the printed form it belongs to. Route it there; the other box stays blank
  // (matching the paper form, which expects only one to be filled — or
  // "same as above" written by hand on the Inviter line).
  const hostRole = s(host?.role).toLowerCase();
  const hostIsInviter = hostRole === "inviter";

  const previousVisits = (bundle.previousVisits ?? [])
    .map((v) => {
      const range = [fmtDate(v.visited_from), fmtDate(v.visited_to)].filter(Boolean).join(" – ");
      return joinParts(range, s(v.duration_note));
    })
    .filter(Boolean)
    .join("; ");

  return {
    surname: s(d?.surname),
    // Given name + father's name/patronymic, as printed on the passport's
    // name line (e.g. "IBROKHIM DAMIN UGLI").
    givenName: [s(d?.given_name), s(d?.middle_name_or_patronymic)].filter(Boolean).join(" "),
    otherNames: s(d?.other_names),
    birthDate: fmtDate(d?.date_of_birth),
    birthCity: s(d?.birth_city),
    birthState: s(d?.birth_state),
    birthCountry: s(d?.country_of_birth),
    sex: asSex(d?.gender),
    maritalStatus: asMarital(d?.marital_status),
    nationality: s(a.nationality) || s(d?.nationality),
    formerNationality: s(d?.former_nationality),
    governmentId: s(d?.home_government_id) || s(d?.korean_arc_number),

    passportType: asPassportType(d?.passport_type),
    passportNumber: s(d?.passport_number),
    passportIssuePlace: s(d?.passport_place_of_issue),
    passportIssueDate: fmtDate(d?.passport_issue_date),
    passportExpiryDate: fmtDate(d?.passport_expiry_date),
    issuingAuthority: s(d?.passport_issuing_authority),

    purposeOfVisit: s(a.travel_purpose) || "Tourism and sightseeing",
    intendedStay: a.stay_days != null ? `${a.stay_days} days` : "",
    arrivalDate: fmtDate(a.travel_start_date),
    portOfEntry: s(a.port_of_entry),
    airlineName: joinParts(s(flight?.airline), s(flight?.flight_number)),

    hotelName: s(firstHotel?.name),
    hotelPhone: s(firstHotel?.phone),
    hotelAddress: s(firstHotel?.address),

    previousJapanVisits: previousVisits,

    residentialAddress: s(a.current_korea_address),
    phone: s(a.client_phone),
    mobile: s(d?.mobile),
    email: s(a.client_email),

    occupation: isStudentStatus(a.korean_visa_status)
      ? joinParts("Student", s(d?.occupation))
      : joinParts(s(d?.occupation), s(d?.position_title)),
    employerName: s(d?.employer_or_school_name),
    employerPhone: s(d?.employer_phone),
    employerAddress: s(d?.employer_or_school_address),

    guarantorName: hostIsInviter ? "" : s(host?.name),
    guarantorPhone: hostIsInviter ? "" : s(host?.phone),
    guarantorAddress: hostIsInviter ? "" : s(host?.address),
    guarantorBirthDate: hostIsInviter ? "" : fmtDate(host?.date_of_birth),
    guarantorSex: hostIsInviter ? "" : asSexOrEmpty(host?.sex),
    guarantorRelationship: hostIsInviter ? "" : s(host?.relationship),
    guarantorOccupation: hostIsInviter ? "" : joinParts(s(host?.occupation)),
    guarantorStatus: hostIsInviter ? "" : joinParts(s(host?.nationality), s(host?.immigration_status)),

    inviterName: hostIsInviter ? s(host?.name) : "",
    inviterPhone: hostIsInviter ? s(host?.phone) : "",
    inviterAddress: hostIsInviter ? s(host?.address) : "",
    inviterBirthDate: hostIsInviter ? fmtDate(host?.date_of_birth) : "",
    inviterSex: hostIsInviter ? asSexOrEmpty(host?.sex) : "",
    inviterRelationship: hostIsInviter ? s(host?.relationship) : "",
    inviterOccupation: hostIsInviter ? joinParts(s(host?.occupation)) : "",
    inviterStatus: hostIsInviter ? joinParts(s(host?.nationality), s(host?.immigration_status)) : "",

    backgroundAnswers: {
      crime: a.background_answers?.crime ?? null,
      imprisonment: a.background_answers?.imprisonment ?? null,
      drugs: a.background_answers?.drugs ?? null,
      deported: a.background_answers?.deported ?? null,
      prostitution: a.background_answers?.prostitution ?? null,
      trafficking: a.background_answers?.trafficking ?? null,
    },
    remarks: s(a.remarks),
  };
}

// --- Document-data mapping layer -------------------------------------------
// Clean entry point for future Japan document templates. Returns the normalized
// visa-form data PLUS a list of "needs attention" items — data that isn't
// confirmed yet. We NEVER fabricate: missing values stay empty and are reported
// here so a template/checklist can show "Needs attention" instead of fake data.
export type JapanDocumentData = {
  visa: JapanVisaData;
  needsAttention: string[];
  // eVisa Personal-Information form only (not on the sticker JapanVisaData):
  email: string;
  // Declaration answer — explicit applicant response only; null = unanswered.
  everDeportedOrDenied: boolean | null;
  // D-2/D-4 (student) applicants have no employer — the eVisa Personal
  // Information template's company/work-phone/work-address fields must stay
  // blank for them rather than being filled with school details.
  isStudent: boolean;
};

export function getJapanDocumentData(bundle: {
  application: JapanAppRow;
  details: JapanDetailRow;
  flight?: JapanFlightRow;
  accommodations?: JapanAccommodationRow[];
  previousVisits?: JapanVisitRow[];
  host?: JapanHostRow;
}): JapanDocumentData {
  const visa = toJapanVisaData(bundle);
  const needsAttention: string[] = [];

  if (!visa.passportNumber) needsAttention.push("Passport number");
  if (!visa.arrivalDate) needsAttention.push("Travel dates");
  if (bundle.application.flight_booked !== true || !visa.airlineName) {
    needsAttention.push("Confirmed flight details");
  }
  if (bundle.application.accommodation_booked !== true || !visa.hotelName) {
    needsAttention.push("Confirmed accommodation");
  }

  const email = s(bundle.application.client_email);
  const everDeportedOrDenied =
    bundle.application.background_answers?.deported ?? null;
  const isStudent = isStudentStatus(bundle.application.korean_visa_status);

  return { visa, needsAttention, email, everDeportedOrDenied, isStudent };
}
