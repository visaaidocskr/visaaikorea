// Fills the official eVisa "Personal Information" Excel template.
//
// The template (docs/…인적사항영….xlsx) is a single sheet where each numbered
// field is one full-width merged row holding a label like "1. Name:". We fill
// by appending the applicant's value to that label's shared string — so ALL
// styling, merges, borders, fonts and layout are preserved untouched; we only
// insert values. There is no photo or signature area in this template, so
// nothing there is ever written.
//
// All values come from the shared mapping layer (getJapanDocumentData) — no
// duplicate mapping, and nothing is fabricated: empty fields are left blank.
import "server-only";
import PizZip from "pizzip";
import type { JapanDocumentData } from "@/lib/docs/japanData";

function xesc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function yesNo(v: boolean | null): string {
  return v === null ? "" : v ? "Yes" : "No";
}

function titleCase(v: string): string {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "";
}

export type JapanExcelResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; missing: string[] };

// The template's blank answer box (cell A18, cell style index 3) is styled
// with a 10pt font — noticeably smaller than the 14pt font used by every
// other filled-in field. An applicant filling this by hand would naturally
// write "No" at the same size as everything else, so we clone that cell
// style with the 14pt font (fontId 2) and use the clone only for A18,
// leaving every other cell that shares style 3 (e.g. the blank spacer row 2)
// untouched.
const ANSWER_BOX_STYLE_INDEX = 3;
const MATCHING_FONT_ID = "2"; // 14pt, same font as the rest of the document

function styleIndexWithLargerFont(zip: PizZip): string | null {
  const stylesPath = "xl/styles.xml";
  const stylesFile = zip.file(stylesPath);
  if (!stylesFile) return null;
  const stylesXml = stylesFile.asText();

  const cellXfsMatch = /<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/.exec(stylesXml);
  if (!cellXfsMatch) return null;
  const count = Number(cellXfsMatch[1]);
  const body = cellXfsMatch[2];

  // Split into individual <xf .../> or <xf ...>...</xf> entries — their
  // position in this list is the style index cells reference via s="N".
  const entries = body.match(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g);
  if (!entries || entries.length !== count || !entries[ANSWER_BOX_STYLE_INDEX]) return null;

  const cloned = entries[ANSWER_BOX_STYLE_INDEX].replace(/fontId="\d+"/, `fontId="${MATCHING_FONT_ID}"`);
  const newIndex = count;
  const newStylesXml = stylesXml.replace(
    cellXfsMatch[0],
    `<cellXfs count="${count + 1}">${body}${cloned}</cellXfs>`
  );
  zip.file(stylesPath, newStylesXml);
  return String(newIndex);
}

// Human labels for the fields that MUST be present to produce a valid official
// document. Others (visiting areas, hotel, visit record, declarations) are left
// blank when absent rather than blocking or fabricating.
// Field 5 (company/university name) is only required for non-students — D-2/D-4
// students have no employer, so fields 5–7 must stay blank for them (see
// isStudent below), and 5 is excluded from the required set in that case.
function requiredLabels(isStudent: boolean): Record<number, string> {
  const labels: Record<number, string> = {
    1: "Name",
    2: "Cell phone",
    3: "Email address",
    4: "Marriage status",
    8: "Purpose of visit",
    10: "Scheduled departure date",
  };
  if (!isStudent) labels[5] = "Company / university name";
  return labels;
}

export function fillJapanEvisaExcel(
  templateBuffer: Buffer,
  doc: JapanDocumentData
): JapanExcelResult {
  const v = doc.visa;
  const isStudent = doc.isStudent;

  // Field number (from the template's "N. …" labels) → value appended directly
  // after that label's own text. Field 15 is handled separately below — its
  // answer goes into the template's dedicated blank answer box (cell A18),
  // not appended after the question text.
  const values: Record<number, string> = {
    1: `${v.surname} ${v.givenName}`.trim(),
    2: v.mobile || v.phone,
    3: doc.email,
    4: titleCase(v.maritalStatus),
    // Students have no employer — the university must NOT appear here.
    5: isStudent ? "" : v.employerName,
    6: isStudent ? "" : v.employerPhone,
    7: isStudent ? "" : v.employerAddress,
    8: v.purposeOfVisit,
    // 9 "Visiting areas to Japan" — not collected → left blank (manual).
    10: v.arrivalDate, // scheduled departure for Japan (trip start)
    11: v.hotelName,
    12: v.hotelAddress,
    13: v.hotelPhone,
    14: v.previousJapanVisits,
    // 16 "Denied a Japanese visa" — not collected → left blank (manual).
  };

  const required = requiredLabels(isStudent);
  const missing = Object.entries(required)
    .filter(([num]) => (values[Number(num)] ?? "").trim() === "")
    .map(([, label]) => label);
  if (missing.length > 0) return { ok: false, missing };

  const zip = new PizZip(templateBuffer);
  const ssPath = "xl/sharedStrings.xml";
  const ssFile = zip.file(ssPath);
  if (!ssFile) return { ok: false, missing: ["Template invalid (sharedStrings.xml)"] };

  // Each label is a unique shared string used exactly once, so appending to its
  // <t> content appends to exactly one cell. Some <si> entries (e.g. "7. Work
  // address:") carry a trailing <phoneticPr> element after </t> — captured and
  // preserved here so that field isn't silently skipped.
  let ssXml = ssFile.asText().replace(
    /<si><t[^>]*>(.*?)<\/t>(.*?)<\/si>/g,
    (whole, text: string, trailing: string) => {
      const m = /^(\d+)\./.exec(text);
      if (!m) return whole; // title / non-numbered → untouched
      const value = values[Number(m[1])];
      if (!value || value.trim() === "") return whole; // blank field → untouched
      const label = text.replace(/\s+$/, "");
      return `<si><t xml:space="preserve">${label} ${xesc(value)}</t>${trailing}</si>`;
    }
  );

  // Field 15's "Yes"/"No" goes into the template's own dedicated blank answer
  // cell (A18, already centered by the template's cell style) directly below
  // the question — not appended after the question text on row 17.
  const stayedIllegallyAnswer = yesNo(doc.everDeportedOrDenied);
  if (stayedIllegallyAnswer) {
    const countMatch = /uniqueCount="(\d+)"/.exec(ssXml);
    const newIndex = countMatch ? Number(countMatch[1]) : 0;
    ssXml = ssXml
      .replace(
        /(<sst[^>]*\bcount=")(\d+)("[^>]*\buniqueCount=")(\d+)(")/,
        (_w, p1, c, p2, u, p3) => `${p1}${Number(c) + 1}${p2}${Number(u) + 1}${p3}`
      )
      .replace("</sst>", `<si><t xml:space="preserve">${xesc(stayedIllegallyAnswer)}</t></si></sst>`);

    const sheetPath = "xl/worksheets/sheet1.xml";
    const sheetFile = zip.file(sheetPath);
    if (sheetFile) {
      const answerStyle = styleIndexWithLargerFont(zip) ?? String(ANSWER_BOX_STYLE_INDEX);
      const sheetXml = sheetFile
        .asText()
        .replace(
          `<c r="A18" s="${ANSWER_BOX_STYLE_INDEX}"/>`,
          `<c r="A18" s="${answerStyle}" t="s"><v>${newIndex}</v></c>`
        );
      zip.file(sheetPath, sheetXml);
    }
  }

  zip.file(ssPath, ssXml);
  const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  return { ok: true, buffer };
}
