// Shared types for the application form + persistence layer.

export type DestinationCountry =
  | "Japan"
  | "Taiwan"
  | "Singapore"
  | "Spain"
  | "Vietnam";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "missing_documents"
  | "documents_generating"
  | "waiting_manual_reservations"
  | "completed"
  // The outcome from the authority itself, as opposed to "completed", which
  // only means our own work is finished. Refusals use "rejected".
  | "visa_granted"
  | "rejected"
  | "cancelled";

// A required/optional supporting document, keyed for storage + checklist.
export type DocumentRequirement = {
  key: string;
  labelEn: string;
  labelKo?: string;
  required: boolean;
  // Shown to the applicant to explain a Korean document name.
  hint?: string;
};

// How a nationality should be asked for the patronymic / middle name.
export type PatronymicRule = "required" | "optional" | "hidden";

// The data the wizard collects, persisted across the applications +
// applicant_details + companions tables.
export type CompanionInput = {
  full_name: string;
  nationality: string;
  relationship: string;
  passport_number?: string;
  is_family_member: boolean;
};

// --- Japan application child records (0006) --------------------------------
export type FlightBooking = {
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  arrival_date: string;
  return_airline: string;
  return_flight_number: string;
  return_date: string;
};

export type AccommodationInput = {
  name: string;
  address: string;
  phone: string;
  check_in: string;
  check_out: string;
};

export type PreviousJapanVisit = {
  visited_from: string;
  visited_to: string;
  duration_note: string;
};

export type HostRole = "" | "inviter" | "guarantor";

export type JapanHostInput = {
  role: HostRole;
  same_as_guarantor: boolean;
  name: string;
  address: string;
  phone: string;
  date_of_birth: string;
  sex: string;
  relationship: string;
  occupation: string;
  nationality: string;
  immigration_status: string;
};

// The 6 page-2 background questions. null = not yet answered (never auto-filled).
export type BackgroundAnswers = {
  crime: boolean | null;
  imprisonment: boolean | null;
  drugs: boolean | null;
  deported: boolean | null;
  prostitution: boolean | null;
  trafficking: boolean | null;
  // The eVisa Personal Information form's question 16 — asked explicitly,
  // never defaulted.
  visa_denied: boolean | null;
};

export type HostType = "" | "none" | "inviter" | "guarantor";

// --- Taiwan application fields (0007) ---------------------------------------
// The official "Visa Application Form for Entry into Taiwan, R.O.C." — a
// different question set from Japan's, so it gets its own small addition
// rather than reusing Japan's types where the meaning wouldn't match.
export type TaiwanTravelPurpose =
  | ""
  | "tourism"
  | "business"
  | "study"
  | "employment"
  | "family"
  | "religion"
  | "entrepreneur"
  | "other";

// The 8 page-2 (A–H) Yes/No declarations. null = not yet answered (never
// auto-filled) — same rule as Japan's BackgroundAnswers.
export type TaiwanBackgroundAnswers = {
  criminalRecord: boolean | null; // A — criminal record / denied entry / deported by R.O.C.
  illegalEntry: boolean | null; // B — entered Taiwan illegally
  communicableDisease: boolean | null; // C — communicable disease / mental disorder / drug abuse
  overstayedOrIllegalWork: boolean | null; // D — overstayed or worked illegally in Taiwan
  drugTrafficking: boolean | null; // E — controlled substance (drug) trafficker
  visaRefused: boolean | null; // F — refused a visa by an R.O.C. mission abroad
  differentName: boolean | null; // G — applied for an R.O.C. visa using a different name
  workedInTaiwan: boolean | null; // H — worked in Taiwan
};

export type ApplyFormData = {
  // Step 1 — destination
  destination_country: string;
  destination_city: string;

  // Step 2 — applicant basics
  nationality: string;
  surname: string;
  given_name: string;
  middle_name_or_patronymic: string;
  full_name_as_passport: string;
  client_phone: string;
  client_email: string;
  korean_visa_status: string;
  current_korea_address: string;
  // Korea province/region — used for Japan sticker/eVisa detection (Phase 3).
  korea_region: string;

  // dates — strict per-destination rules applied in Phase 3
  planned_submission_date: string;
  travel_start_date: string;
  travel_end_date: string;

  // Free-text "why did you choose this destination?" answer, in the
  // applicant's own words (0–150 words, enforced client-side). Generic
  // across every destination — feeds a fuller Travel Purpose Statement.
  trip_reason: string;

  // Step 4 — companions
  companions: CompanionInput[];

  // --- Japan application fields (0006). Other destinations leave these empty.
  // Personal
  other_names: string;
  former_nationality: string;
  date_of_birth: string;
  birth_city: string;
  birth_state: string;
  country_of_birth: string;
  gender: string; // "male" | "female" | ""
  marital_status: string; // single | married | divorced | widowed | ""
  home_government_id: string;

  // Passport
  passport_type: string; // diplomatic | official | ordinary | other | ""
  passport_number: string;
  passport_place_of_issue: string;
  passport_issue_date: string;
  passport_issuing_authority: string;
  passport_expiry_date: string;

  // Status in Korea / employment
  occupation: string;
  position_title: string;
  employer_or_school_name: string;
  employer_or_school_address: string;
  employer_phone: string;
  mobile: string;

  // Japan trip
  travel_purpose: string;
  port_of_entry: string;

  // Flight
  flight_booked: boolean | null;
  flight: FlightBooking;

  // Accommodation
  accommodation_booked: boolean | null;
  accommodations: AccommodationInput[];

  // Previous Japan visits
  has_previous_japan_visits: boolean | null;
  previous_japan_visits: PreviousJapanVisit[];

  // Inviter / guarantor
  host_type: HostType;
  host: JapanHostInput;

  // Additional
  spouse_or_parent_occupation: string;
  remarks: string;
  background_answers: BackgroundAnswers;

  // --- Taiwan application fields (0007). Other destinations leave these empty.
  home_country_address: string;
  home_country_phone: string;
  taiwan_travel_purpose: TaiwanTravelPurpose;
  taiwan_travel_purpose_other: string;
  taiwan_background_answers: TaiwanBackgroundAnswers;

  // --- Vietnam application fields (0012). Other destinations leave these
  // empty. No official multi-page form to replicate — this is what
  // Vietnam's e-Visa portal itself asks beyond the generic applicant/passport
  // fields already collected above.
  vietnam_family_member_name: string;
  vietnam_family_member_phone: string;
  vietnam_family_member_address: string;
  // How that person is related to the applicant. "other" reveals a free-text
  // box, so an uncommon relationship can still be stated exactly.
  vietnam_family_member_relationship:
    | ""
    | "father"
    | "mother"
    | "brother"
    | "sister"
    | "other";
  vietnam_family_member_relationship_other: string;
  // Already bought travel insurance for the trip? null = not answered yet.
  vietnam_insurance_purchased: boolean | null;
  vietnam_financing_source: "" | "personal" | "other";
  vietnam_financier_name: string;
  vietnam_financier_relationship: string;
  vietnam_financier_phone: string;
  vietnam_financier_address: string;
  // Asked about the 10-hour express service? null = not answered yet. Never
  // pre-selected — a "yes" is a real request an admin follows up on.
  vietnam_express_requested: boolean | null;
};

// Empty defaults so builders (page.tsx initialForm) stay terse.
export const EMPTY_FLIGHT: FlightBooking = {
  airline: "",
  flight_number: "",
  departure_airport: "",
  arrival_airport: "",
  departure_date: "",
  arrival_date: "",
  return_airline: "",
  return_flight_number: "",
  return_date: "",
};

export const EMPTY_HOST: JapanHostInput = {
  role: "",
  same_as_guarantor: false,
  name: "",
  address: "",
  phone: "",
  date_of_birth: "",
  sex: "",
  relationship: "",
  occupation: "",
  nationality: "",
  immigration_status: "",
};

export const EMPTY_BACKGROUND: BackgroundAnswers = {
  crime: null,
  imprisonment: null,
  drugs: null,
  deported: null,
  prostitution: null,
  trafficking: null,
  visa_denied: null,
};

export const EMPTY_TAIWAN_BACKGROUND: TaiwanBackgroundAnswers = {
  criminalRecord: null,
  illegalEntry: null,
  communicableDisease: null,
  overstayedOrIllegalWork: null,
  drugTrafficking: null,
  visaRefused: null,
  differentName: null,
  workedInTaiwan: null,
};
