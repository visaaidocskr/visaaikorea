// Builds the data for the Japan Document Checklist (rendered to PDF via the
// print route). Reuses the routing/mapping layer — it never re-implements route
// logic. Distinguishes documents WE generate from documents the applicant must
// provide, and states the route.
import { getJapanDocumentPlan } from "@/lib/docs/japanRouting";
import { documentsForStatus } from "@/lib/visa/config";
import type {
  JapanAppRow,
  JapanDetailRow,
  JapanFlightRow,
  JapanAccommodationRow,
  JapanVisitRow,
  JapanHostRow,
} from "@/lib/docs/japanData";

export type JapanChecklistData = {
  applicantName: string;
  route: "sticker" | "evisa";
  routeLabel: string;
  generated: string[]; // prepared by Vitamin Visa
  applicantProvided: string[]; // the applicant supplies these
};

function s(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export function getJapanChecklistData(bundle: {
  application: JapanAppRow;
  details: JapanDetailRow;
  flight?: JapanFlightRow;
  accommodations?: JapanAccommodationRow[];
  previousVisits?: JapanVisitRow[];
  host?: JapanHostRow;
}): JapanChecklistData {
  const plan = getJapanDocumentPlan(bundle);
  const a = bundle.application;
  const details = bundle.details;

  const formTitle =
    plan.route === "sticker"
      ? "Japan Visa Application Form (PDF)"
      : "Personal Information form (Excel)";

  const generated = [
    formTitle,
    "Daily Travel Itinerary (DOCX)",
    "Document Checklist (this document)",
  ];

  const applicantProvided: string[] = [
    plan.route === "sticker"
      ? "Passport (original — submitted with the application)"
      : "Passport",
    "Alien Registration Card (ARC) — front and back",
    "Recent photograph (45 × 45 mm)",
    "Bank balance certificate (recommended)",
  ];

  // Status-based supporting documents (enrollment / employment certificate,
  // etc.) — excluding the identity docs already listed above.
  const base = new Set(["passport", "arc_front", "arc_back"]);
  for (const d of documentsForStatus(
    s(a.korean_visa_status),
    undefined,
    undefined,
    s(details?.marital_status)
  )) {
    if (base.has(d.key)) continue;
    const suffix = !d.required && !/if available/i.test(d.labelEn) ? " (if available)" : "";
    applicantProvided.push(d.labelEn + suffix);
  }

  if (a.flight_booked === true) applicantProvided.push("Flight reservation / e-ticket");
  if (a.accommodation_booked === true) applicantProvided.push("Hotel booking confirmation");
  applicantProvided.push("Signed application form (you sign after printing)");

  return {
    applicantName: [plan.data.surname, plan.data.givenName].filter(Boolean).join(" "),
    route: plan.route,
    routeLabel: plan.routeLabel,
    generated,
    applicantProvided,
  };
}
