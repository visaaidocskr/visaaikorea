// Programmatic DOCX generators using the `docx` library (server-only).
// These produce system documents that don't require an uploaded template.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  ImageRun,
  BorderStyle,
  TableBorders,
  VerticalAlign,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from "docx";
import { getDestinationRule } from "@/lib/visa/destinations";
import { buildTemplateData, type GenBundle } from "@/lib/docs/templateData";
import { polishTripReason } from "@/lib/ai/polishTripReason";

// Faint per-country background art for the Travel Purpose Statement — purely
// decorative, hand-drawn minimalist line-art (not real photography), kept
// intentionally low-opacity so it never interferes with legibility or looks
// like an official watermark/stamp.
const WATERMARK_DIR = path.join(process.cwd(), "lib", "docs", "assets", "watermarks");
const WATERMARK_FILES: Record<string, string> = {
  Japan: "japan.png",
  Taiwan: "taiwan.png",
  Singapore: "singapore.png",
  Spain: "spain.png",
};

function watermarkHeader(destinationCountry: string): Header | undefined {
  const file = WATERMARK_FILES[destinationCountry];
  if (!file) return undefined;
  const fullPath = path.join(WATERMARK_DIR, file);
  if (!fs.existsSync(fullPath)) return undefined;
  const data = fs.readFileSync(fullPath);
  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: "png",
            data,
            transformation: { width: 420, height: 420 },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.CENTER,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.CENTER,
              },
              behindDocument: true,
              wrap: { type: TextWrappingType.NONE },
            },
          }),
        ],
      }),
    ],
  });
}

// Note: no agency disclaimer is added to these documents — they're submitted
// to the embassy/consulate as the applicant's own paperwork. The service
// disclaimer belongs in client-facing places (site, emails, guidance step),
// not baked into documents that go to the authorities.

function heading(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });
}
function sub(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
}
function line(text: string, opts?: { bold?: boolean }) {
  return new Paragraph({ children: [new TextRun({ text, bold: opts?.bold })], spacing: { after: 80 } });
}

async function pack(
  children: Paragraph[] | (Paragraph | Table)[],
  header?: Header
): Promise<Buffer> {
  const doc = new Document({
    sections: [{ children, headers: header ? { default: header } : undefined }],
  });
  return Packer.toBuffer(doc);
}

// Accent color + shared "info table" cell helpers for the redesigned
// Travel Purpose Statement (see generateTravelPurposeDoc below).
const ACCENT = "1D4ED8"; // matches the app's blue-700

function labelCell(text: string) {
  return new TableCell({
    width: { size: 32, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "64748B", size: 18 })],
      }),
    ],
  });
}
function valueCell(text: string) {
  return new TableCell({
    width: { size: 68, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || "—", size: 20 })],
      }),
    ],
  });
}
function infoTable(rows: [string, string][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: rows.map(
      ([k, v]) => new TableRow({ children: [labelCell(k), valueCell(v)] })
    ),
  });
}

// --- Daily Travel Itinerary -----------------------------------------------
export async function generateItineraryDoc(bundle: GenBundle): Promise<Buffer> {
  const data = buildTemplateData(bundle);
  const cell = (text: string, bold = false) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    });

  const rows = [
    new TableRow({
      children: [cell("Date", true), cell("Morning", true), cell("Afternoon", true), cell("Evening", true)],
    }),
    ...data.itinerary_days.map(
      (d) =>
        new TableRow({
          children: [cell(d.date), cell(d.morning), cell(d.afternoon), cell(d.evening)],
        })
    ),
  ];

  const children: (Paragraph | Table)[] = [
    heading("Daily Travel Itinerary"),
    line(`Applicant: ${data.applicant.full_name || "—"}`),
    line(`Destination: ${data.application.destination_country} ${data.application.destination_city}`.trim()),
    line(`Travel period: ${data.application.travel_start_date} to ${data.application.travel_end_date}`),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
  ];

  if (data.companions.length > 0) {
    children.push(sub("Companions"));
    data.companions.forEach((c, i) =>
      children.push(line(`${i + 1}. ${c.full_name}${c.relationship ? ` — ${c.relationship}` : ""}${c.nationality ? ` (${c.nationality})` : ""}`))
    );
  }
  // No agency disclaimer here — this document is submitted to the embassy/
  // consulate as the applicant's own travel plan. The service disclaimer
  // belongs in client-facing places (site, emails, guidance step), not
  // baked into paperwork that goes to the authorities.
  return pack(children);
}

// --- Travel Purpose Statement ---------------------------------------------
// Professionally laid out: title block, applicant/trip info tables, a fuller
// narrative built from the client's actual data, and — if the applicant
// answered the "why this destination?" question in the wizard — their own
// words quoted directly, since that's the most persuasive/authentic part of
// the statement. A faint per-country watermark sits behind the text.
export async function generateTravelPurposeDoc(bundle: GenBundle): Promise<Buffer> {
  const data = buildTemplateData(bundle);
  const a = data.application;
  const p = data.applicant;
  const dest = `${a.destination_country}${a.destination_city ? `, ${a.destination_city}` : ""}`;
  const employment =
    [p.position_title, p.employer_or_school_name].filter(Boolean).join(" at ") ||
    p.occupation;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "TRAVEL PURPOSE STATEMENT", bold: true, size: 32, color: ACCENT }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Prepared in support of a short-stay visa application to ${dest}`,
          size: 20,
          color: "64748B",
        }),
      ],
      alignment: AlignmentType.CENTER,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 8 },
      },
      spacing: { after: 260 },
    }),

    sub("Applicant Information"),
    infoTable([
      ["Full name", p.full_name],
      ["Nationality", p.nationality],
      ["Passport number", p.passport_number],
      ["Date of birth", p.date_of_birth],
      ["Status in Korea", a.korean_visa_status],
      ...(employment ? ([["Occupation", employment]] as [string, string][]) : []),
    ]),

    sub("Trip Details"),
    infoTable([
      ["Destination", dest],
      ["Travel dates", `${a.travel_start_date} to ${a.travel_end_date}`],
      ["Duration", a.stay_days ? `${a.stay_days} days` : "—"],
      ["Purpose of visit", a.travel_purpose],
    ]),

    new Paragraph({ text: "", spacing: { after: 100 } }),
    sub("Statement"),
    line("To the visa-issuing authority,"),
    new Paragraph({
      children: [
        new TextRun(
          `My name is ${p.full_name || "[applicant]"}, a ${p.nationality || ""} national currently residing in the Republic of Korea under ${a.korean_visa_status || "valid"} status` +
            (employment ? `, working as ${employment}` : "") +
            `. `
        ),
        new TextRun(
          `I am planning a short tourist trip to ${dest} from ${a.travel_start_date} to ${a.travel_end_date}, a total of ${a.stay_days || "—"} day${a.stay_days === "1" ? "" : "s"}. `
        ),
        new TextRun(
          `The purpose of my visit is ${a.travel_purpose}.`
        ),
      ],
      spacing: { after: 160 },
    }),
  ];

  if (a.trip_reason) {
    // Translate (if needed) and polish into professional English — falls
    // back to the applicant's original text if ANTHROPIC_API_KEY isn't set
    // or the API call fails, so this never blocks document generation.
    const displayReason = (await polishTripReason(a.trip_reason, a.destination_country)) ?? a.trip_reason;
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Why I chose ${a.destination_country}`, bold: true, size: 20 })],
        spacing: { before: 40, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: displayReason, italics: true })],
        indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 12 } },
        spacing: { after: 200 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun(
          `I will return to the Republic of Korea after the trip, where I maintain my residence and current ${a.korean_visa_status || ""} status. All travel and accommodation arrangements have been made in line with the planned itinerary, and I intend to comply fully with the immigration laws of ${a.destination_country || "the destination country"}.`
        ),
      ],
      spacing: { after: 160 },
    })
  );

  if (data.companions.length > 0) {
    children.push(
      line(
        `I will travel together with: ${data.companions.map((c) => `${c.full_name}${c.relationship ? ` (${c.relationship})` : ""}`).join(", ")}.`
      )
    );
  }

  children.push(line("Thank you for your kind consideration."));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1", space: 4 } },
      spacing: { before: 40 },
      children: [new TextRun({ text: p.full_name, bold: true })],
    })
  );
  children.push(line(`${a.client_email} · ${a.client_phone}`));

  return pack(children, watermarkHeader(a.destination_country));
}

// --- List of Applicants / Companions --------------------------------------
export async function generateApplicantListDoc(bundle: GenBundle): Promise<Buffer> {
  const data = buildTemplateData(bundle);
  const children: Paragraph[] = [
    heading("List of Applicants"),
    line(`1. ${data.applicant.full_name} (Main applicant) — ${data.applicant.nationality}`, { bold: true }),
  ];
  data.companions.forEach((c, i) =>
    children.push(
      line(`${i + 2}. ${c.full_name}${c.relationship ? ` — ${c.relationship}` : ""}${c.nationality ? ` (${c.nationality})` : ""}`)
    )
  );
  return pack(children);
}

// --- Cover Letter (Spain / generic) ---------------------------------------
export async function generateCoverLetterDoc(bundle: GenBundle): Promise<Buffer> {
  const data = buildTemplateData(bundle);
  const dest = `${data.application.destination_country}${data.application.destination_city ? `, ${data.application.destination_city}` : ""}`;

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Cover Letter", bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    line("Dear Sir or Madam,"),
    new Paragraph({
      children: [
        new TextRun(
          `I, ${data.applicant.full_name || "[applicant]"}, holder of passport ${data.applicant.passport_number || "[number]"} (${data.applicant.nationality}), kindly request a short-stay visa to visit ${dest}. `
        ),
        new TextRun(
          `I currently live in the Republic of Korea under ${data.application.korean_visa_status} status at ${data.application.current_korea_address}. `
        ),
        new TextRun(
          `My planned travel is from ${data.application.travel_start_date} to ${data.application.travel_end_date} for ${data.application.travel_purpose}. `
        ),
        new TextRun(
          `I have arranged round-trip transport and accommodation, hold travel medical insurance, and will return to Korea where I maintain my residence and status.`
        ),
      ],
      spacing: { after: 120 },
    }),
    line("I would be grateful for your favourable consideration."),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    line("Sincerely,"),
    line(data.applicant.full_name),
    line(`${data.application.client_email} · ${data.application.client_phone}`),
  ];
  return pack(children);
}

// --- Document checklist (Schengen support / general) ----------------------
export async function generateChecklistDoc(bundle: GenBundle): Promise<Buffer> {
  const data = buildTemplateData(bundle);
  const rule = getDestinationRule(data.application.destination_country);
  const docs = rule?.documents ?? [];
  const children: Paragraph[] = [
    heading(`${data.application.destination_country} Document Checklist`),
    line(`Applicant: ${data.applicant.full_name || "—"}`),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    ...docs.map((d) => new Paragraph({ text: d, bullet: { level: 0 } })),
  ];
  return pack(children);
}
