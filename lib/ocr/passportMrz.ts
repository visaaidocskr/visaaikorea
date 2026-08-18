// Reads the Machine Readable Zone (MRZ) off a photo of a passport's photo
// page and returns structured, best-effort field suggestions.
//
// Two stages:
//   1. OCR (tesseract.js) turns the photo into raw text.
//   2. The `mrz` library parses the two 44-char MRZ lines it finds in that
//      text, validating each field's built-in checksum digit.
//
// This NEVER writes anything to the application on its own — it only returns
// suggested values. The caller (a server action) hands them back to the
// browser, and the applicant/agent must explicitly apply them. Same "never
// fabricate" rule as the rest of the document-generation code: if the MRZ
// can't be found or doesn't parse cleanly, we say so instead of guessing.
import "server-only";
import { createWorker } from "tesseract.js";
import { parse as parseMrz, states as mrzStates } from "mrz";

export type PassportMrzFields = {
  surname: string;
  givenName: string;
  fullName: string;
  passportNumber: string;
  nationality: string; // full country name (best-effort — blank if unrecognized)
  nationalityCode: string; // raw 3-letter MRZ code, always kept even if unrecognized
  dateOfBirth: string; // YYYY-MM-DD, or "" if unreadable
  sex: "male" | "female" | "";
  passportExpiryDate: string; // YYYY-MM-DD, or "" if unreadable
};

export type PassportMrzResult =
  | { ok: true; fields: PassportMrzFields; valid: boolean; rawLines: string[] }
  | { ok: false; error: string };

// The `mrz` package's ISO-3166 state names are the formal ICAO ones (e.g.
// "Russian Federation (the)", "Viet Nam", "Taiwan (Province of China)",
// "Philippines (the)") — not the short, everyday names this app's
// nationality dropdown uses ("Russia", "Vietnam", "Taiwan", "Philippines").
// Override the ones we know mismatch; generically strip a trailing
// "(the)"/"(Province of China)" annotation for anything else so a future
// nationality is more likely to line up too.
const STATE_NAME_OVERRIDES: Record<string, string> = {
  RUS: "Russia",
  VNM: "Vietnam",
  PHL: "Philippines",
  TWN: "Taiwan",
};
function normalizeStateName(code: string, icaoName: string): string {
  if (STATE_NAME_OVERRIDES[code]) return STATE_NAME_OVERRIDES[code];
  return icaoName.replace(/\s*\((?:the|Province of China)\)\s*$/i, "").trim();
}

// MRZ dates are 2-digit years (YYMMDD). Expiry is always "now-ish or later",
// so the 2000s century is always right. Birth dates can't be in the future,
// so we fall back to the 1900s when the 2000s reading would be.
function yymmddToIso(yymmdd: string, kind: "birth" | "expiry"): string {
  if (!/^\d{6}$/.test(yymmdd)) return "";
  const yy = Number(yymmdd.slice(0, 2));
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  let century = 2000;
  if (kind === "birth") {
    const candidateYear = 2000 + yy;
    if (candidateYear > new Date().getFullYear()) century = 1900;
  }
  return `${century + yy}-${mm}-${dd}`;
}

// OCR regularly misreads the MRZ's "<" filler characters as letters (most
// often L, K, I, C, E or T), which the MRZ parser then hands back as an extra
// one-letter "name" — e.g. "SHAKHNOZA ABDURAUFOVNA L".
//
// Single letters are NOT always noise though: some names genuinely have a
// one-letter element (Vietnamese "NGUYEN VAN A"). So this only drops a
// trailing single letter when at least two real words remain without it —
// the shape that real names essentially never take, and that trailing OCR
// filler always does. Anything more aggressive risks silently deleting a
// real name, which is worse than leaving visible noise the applicant can
// see in the filled field and correct.
function dropStrayInitials(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3 && words[words.length - 1].length === 1) {
    return words.slice(0, -1).join(" ");
  }
  return words.join(" ");
}

// Pulls the two bottom MRZ lines (TD3 passport format, 44 chars each) out of
// raw OCR text. OCR also picks up other printed text on the photo page, so we
// look for lines that are almost entirely A-Z / 0-9 / "<" — that's the
// unmistakable signature of an MRZ line — and take the last two such lines
// (the MRZ always sits at the very bottom of the page).
function findMrzLines(rawText: string): string[] | null {
  const candidates = rawText
    .split("\n")
    .map((l) => l.trim().toUpperCase().replace(/\s+/g, ""))
    .filter((l) => l.length >= 30);

  const mrzLike = candidates.filter((l) => {
    const cleanChars = l.match(/[A-Z0-9<]/g)?.length ?? 0;
    return cleanChars / l.length > 0.85 && l.length >= 30 && l.length <= 46;
  });
  if (mrzLike.length < 2) return null;

  return mrzLike.slice(-2).map((l) => l.padEnd(44, "<").slice(0, 44));
}

export async function scanPassportMrz(
  imageBuffer: Buffer
): Promise<PassportMrzResult> {
  let text: string;
  try {
    const worker = await createWorker("eng");
    try {
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
      });
      const {
        data: { text: recognized },
      } = await worker.recognize(imageBuffer);
      text = recognized;
    } finally {
      await worker.terminate();
    }
  } catch (e) {
    return { ok: false, error: `OCR failed: ${(e as Error).message}` };
  }

  const lines = findMrzLines(text);
  if (!lines) {
    return {
      ok: false,
      error:
        "Could not find a machine-readable zone (the two code lines at the bottom of the passport photo page). Use a sharp, well-lit, uncropped photo of the whole page.",
    };
  }

  let parsed: ReturnType<typeof parseMrz>;
  try {
    parsed = parseMrz(lines, { autocorrect: true });
  } catch (e) {
    return { ok: false, error: `MRZ format not recognized: ${(e as Error).message}` };
  }

  const f = parsed.fields;
  if (!f.lastName || !f.documentNumber) {
    return {
      ok: false,
      error: "The code lines were found but couldn't be read clearly. Try a sharper photo.",
    };
  }

  const nationalityCode = f.nationality ?? "";
  const icaoName = nationalityCode
    ? (mrzStates as Record<string, string | undefined>)[nationalityCode]
    : undefined;
  const nationality = icaoName ? normalizeStateName(nationalityCode, icaoName) : "";

  const surname = dropStrayInitials(f.lastName ?? "");
  const givenName = dropStrayInitials(f.firstName ?? "");

  const fields: PassportMrzFields = {
    surname,
    givenName,
    fullName: [surname, givenName].filter(Boolean).join(" "),
    passportNumber: f.documentNumber ?? "",
    nationality,
    nationalityCode,
    dateOfBirth: f.birthDate ? yymmddToIso(f.birthDate, "birth") : "",
    sex: f.sex === "male" || f.sex === "female" ? f.sex : "",
    passportExpiryDate: f.expirationDate ? yymmddToIso(f.expirationDate, "expiry") : "",
  };

  return { ok: true, fields, valid: parsed.valid, rawLines: lines };
}
