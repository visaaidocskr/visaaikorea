// One-time generator for the docxtemplater template used by
// /api/generate-documents. Produces public/templates/japan/itinerary.docx
// as a formal, embassy-style document: title, applicant info table, and a
// per-day table (Day | Date | Morning | Afternoon | Evening) that repeats via
// a docxtemplater table-row loop ({#days} … {/days} inside one row).
//
// Tags are kept in single runs so they are not split across <w:r> nodes.
// Re-run with:  npx tsx scripts/build-japan-itinerary-template.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const INK = "1F2937"; // near-black, dark slate
const LINE = "9CA3AF"; // gray cell borders
const HEADER_FILL = "F1F3F5"; // very light gray header shading

const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const tableBorders = {
  top: thin,
  bottom: thin,
  left: thin,
  right: thin,
  insideHorizontal: thin,
  insideVertical: thin,
};
const cellMargins = { top: 60, bottom: 60, left: 110, right: 110 };

function text(t: string, opts: { bold?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    alignment: opts.align,
    children: [new TextRun({ text: t, bold: opts.bold, size: opts.size ?? 20, color: INK })],
  });
}

// --- Applicant information table (2 columns: label / value) ----------------
function infoRow(label: string, valueTag: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: HEADER_FILL },
        margins: cellMargins,
        children: [text(label, { bold: true })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: cellMargins,
        children: [text(valueTag)],
      }),
    ],
  });
}

const infoTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: tableBorders,
  rows: [
    infoRow("Applicant Name", "{applicant_name}"),
    infoRow("Nationality", "{nationality}"),
    infoRow("Destination", "{destination}"),
    infoRow("Travel Period", "{travel_period}"),
    infoRow("Total Stay", "{total_stay}"),
  ],
});

// --- Day-by-day itinerary table --------------------------------------------
function headerCell(label: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { fill: HEADER_FILL },
    margins: cellMargins,
    children: [text(label, { bold: true })],
  });
}
// The loop tags live inside this single row -> docxtemplater repeats the row.
function dayCell(content: string, width: number, opts: { bold?: boolean } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    margins: cellMargins,
    children: [text(content, { bold: opts.bold })],
  });
}

const dayTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: tableBorders,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Day", 9),
        headerCell("Date", 17),
        headerCell("Morning", 24.6),
        headerCell("Afternoon", 24.7),
        headerCell("Evening", 24.7),
      ],
    }),
    new TableRow({
      children: [
        dayCell("{#days}Day {day_no}", 9, { bold: true }),
        dayCell("{date}", 17),
        dayCell("{morning}", 24.6),
        dayCell("{afternoon}", 24.7),
        dayCell("{evening}{/days}", 24.7),
      ],
    }),
  ],
});

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 20, color: INK } },
    },
  },
  sections: [
    {
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: "JAPAN DAILY TRAVEL ITINERARY", bold: true, size: 32, color: INK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: INK, space: 6 } },
          children: [new TextRun({ text: "", size: 2 })],
        }),

        text("Applicant Information", { bold: true, size: 22 }),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        infoTable,

        new Paragraph({ spacing: { before: 320, after: 80 }, children: [new TextRun({ text: "Daily Schedule", bold: true, size: 22, color: INK })] }),
        dayTable,

        new Paragraph({
          spacing: { before: 360 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 8 } },
          children: [
            new TextRun({
              text: "This itinerary is prepared for visa application purposes. Final visa approval is decided solely by the Embassy or Consulate-General of Japan.",
              italics: true,
              size: 16,
              color: "6B7280",
            }),
          ],
        }),
      ],
    },
  ],
});

const outDir = path.join(process.cwd(), "public", "templates", "japan");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "itinerary.docx");
Packer.toBuffer(doc).then((buf) => {
  writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${buf.length} bytes)`);
});
