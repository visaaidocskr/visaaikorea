// ============================================================================
// Japan document routing — the single, centralized source of truth for:
//   applicant ARC/Korean address → jurisdiction → visa route → document set →
//   correct template → (later) mapped data → generated document.
//
// Japan applications in Korea are NOT one universal form. Which documents apply
// depends on the applicant's registered Korean residence (ARC jurisdiction),
// which selects the visa route:
//   • "sticker" — jurisdictions handled through the Busan Consulate: the paper
//     "Visa Application Form to Enter Japan" is prepared and submitted.
//   • "evisa"  — online (Japan eVisa portal) route: personal data is entered
//     online; a signed declaration page accompanies the online application.
//
// This module keeps that routing/config in ONE place. It does NOT generate any
// documents — it defines the route, the required document set, the template
// selection, and per-template field requirements so generation can be wired up
// cleanly afterward.
// ============================================================================
import { japanProcessingType, japanRouteForRegion } from "@/lib/visa/destinations";
import {
  getJapanDocumentData,
  type JapanAppRow,
  type JapanDetailRow,
  type JapanFlightRow,
  type JapanAccommodationRow,
  type JapanVisitRow,
  type JapanHostRow,
} from "@/lib/docs/japanData";
import type { JapanVisaData } from "@/components/forms/JapanVisaForm";

export type JapanRoute = "sticker" | "evisa";

// HARD RULE for every Japan document: the photo box and the signature field are
// ALWAYS left blank. The system never inserts an image, draws/types a signature,
// or places the applicant's name in the signature field. The applicant prints
// the completed document and adds their own physical photo + signature. Any
// future generation code MUST honor this.
export const NEVER_AUTOFILL = ["photo", "signature"] as const;

// A required field on a template, expressed against the normalized JapanVisaData
// so completeness can be checked without touching raw DB columns.
export type FieldReq = { key: keyof JapanVisaData; label: string };

export type JapanTemplate = {
  id: string;
  title: string;
  file: string; // reference path in /docs (not read at generation time yet)
  kind: "application_form" | "signature_declaration";
  appliesTo: JapanRoute[];
  // Data fields this template needs filled. Empty for a print-and-sign page.
  requiredFields: FieldReq[];
  // Provided by the applicant, NEVER auto-filled/fabricated.
  applicantProvided: string[];
  notes?: string;
};

// Fields required by the official "Visa Application Form to Enter Japan".
// Bookings (hotel/flight) are handled via getJapanDocumentData().needsAttention,
// not forced here, so an unbooked applicant isn't blocked with fabricated data.
const APPLICATION_FORM_FIELDS: FieldReq[] = [
  { key: "surname", label: "Surname" },
  { key: "givenName", label: "Given name" },
  { key: "birthDate", label: "Date of birth" },
  { key: "birthCountry", label: "Country of birth" },
  { key: "sex", label: "Sex" },
  { key: "maritalStatus", label: "Marital status" },
  { key: "nationality", label: "Nationality" },
  { key: "passportType", label: "Passport type" },
  { key: "passportNumber", label: "Passport number" },
  { key: "passportIssuePlace", label: "Passport place of issue" },
  { key: "passportIssueDate", label: "Passport date of issue" },
  { key: "issuingAuthority", label: "Passport issuing authority" },
  { key: "passportExpiryDate", label: "Passport date of expiry" },
  { key: "purposeOfVisit", label: "Purpose of visit" },
  { key: "intendedStay", label: "Intended length of stay" },
  { key: "arrivalDate", label: "Date of arrival" },
  { key: "portOfEntry", label: "Port of entry" },
  { key: "residentialAddress", label: "Residential address in Korea" },
  { key: "phone", label: "Phone" },
  { key: "occupation", label: "Occupation" },
];

// The template catalog. Add future documents / routes here only.
export const JAPAN_TEMPLATES: JapanTemplate[] = [
  {
    id: "visa_application_form",
    title: "Visa Application Form to Enter Japan",
    file: "docs/1japan_visa_application_form.pdf",
    kind: "application_form",
    appliesTo: ["sticker"],
    requiredFields: APPLICATION_FORM_FIELDS,
    applicantProvided: ["Signature", "Photo (45×45 mm)"],
  },
  {
    id: "evisa_signature_declaration",
    title: "Online Application — Declaration & Signature",
    file: "docs/TalkFile_온라인신청_서명란3_pdf.pdf",
    kind: "signature_declaration",
    appliesTo: ["evisa"],
    // A print-and-sign declaration page — no data fields are pre-filled.
    requiredFields: [],
    applicantProvided: ["Signature"],
    notes:
      "eVisa route: personal details are entered on the Japan eVisa portal; this signed declaration accompanies the online application.",
  },
];

// --- Jurisdiction → route resolver -----------------------------------------
// Reuses the existing ARC-region/address detection (single source of truth for
// the sticker/eVisa split); this module never re-implements that logic.
export function resolveJapanRoute(region: string, address: string): JapanRoute {
  return japanProcessingType(region, address);
}

export function japanRouteLabel(region: string) {
  return japanRouteForRegion(region);
}

export function japanTemplatesForRoute(route: JapanRoute): JapanTemplate[] {
  return JAPAN_TEMPLATES.filter((t) => t.appliesTo.includes(route));
}

// --- The document plan ------------------------------------------------------
export type JapanDocumentPlan = {
  route: JapanRoute;
  routeLabel: string;
  data: JapanVisaData;
  templates: {
    template: JapanTemplate;
    missing: FieldReq[]; // required fields still lacking data ("Needs attention")
    ready: boolean;
  }[];
  // Booking/other items not confirmed yet (from the data mapper).
  needsAttention: string[];
};

export function getJapanDocumentPlan(bundle: {
  application: JapanAppRow;
  details: JapanDetailRow;
  flight?: JapanFlightRow;
  accommodations?: JapanAccommodationRow[];
  previousVisits?: JapanVisitRow[];
  host?: JapanHostRow;
}): JapanDocumentPlan {
  const region = bundle.application.city_region_detected ?? "";
  const address = bundle.application.current_korea_address ?? "";
  const route = resolveJapanRoute(region, address);

  const { visa, needsAttention } = getJapanDocumentData(bundle);

  const templates = japanTemplatesForRoute(route).map((template) => {
    const missing = template.requiredFields.filter(
      (f) => String(visa[f.key] ?? "").trim() === ""
    );
    return { template, missing, ready: missing.length === 0 };
  });

  return {
    route,
    routeLabel: japanRouteForRegion(region).label,
    data: visa,
    templates,
    needsAttention,
  };
}
