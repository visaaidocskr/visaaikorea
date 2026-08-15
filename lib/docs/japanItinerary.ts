// Renders the Japan daily itinerary DOCX from the docxtemplater template at
// public/templates/japan/itinerary.docx. Server-only.
//
// Reuses the existing deterministic itinerary engine (lib/visa/itinerary.ts),
// which rotates through the Tokyo POI pool by seed so different applicants get
// different routes. No hotel section is emitted.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { generateItinerary } from "@/lib/visa/itinerary";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "templates",
  "japan",
  "itinerary.docx"
);

export type JapanItineraryInput = {
  applicantName: string;
  nationality: string;
  destinationCity: string;
  travelStart: string; // YYYY-MM-DD
  travelEnd: string; // YYYY-MM-DD
  seed: string; // stable per application -> reproducible route
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-07-03" -> "03 Jul 2026" for a cleaner embassy-style date.
function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function renderJapanItineraryDocx(input: JapanItineraryInput): Buffer {
  const city = input.destinationCity || "Tokyo";

  const days = generateItinerary({
    destinationCountry: "Japan",
    destinationCity: city,
    travelStart: input.travelStart,
    travelEnd: input.travelEnd,
    seed: input.seed,
  });
  if (days.length === 0) {
    throw new Error("Invalid travel dates: end date must be on or after start date.");
  }

  const data = {
    applicant_name: (input.applicantName || "—").toUpperCase(),
    nationality: input.nationality || "—",
    destination: `${city}, Japan`,
    travel_period: `${prettyDate(input.travelStart)} – ${prettyDate(input.travelEnd)}`,
    total_stay: `${days.length} ${days.length === 1 ? "day" : "days"}`,
    days: days.map((d, i) => ({
      day_no: String(i + 1),
      date: prettyDate(d.date),
      morning: d.morning,
      afternoon: d.afternoon,
      evening: d.evening,
    })),
  };

  const content = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  doc.render(data);

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
