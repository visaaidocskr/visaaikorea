// Best-effort heuristic extraction of flight / hotel booking fields from raw
// document text (see lib/ocr/documentText.ts for how that text is obtained).
//
// Unlike passport MRZ (lib/ocr/passportMrz.ts), flight e-tickets and hotel
// confirmations have NO standard format — every airline, travel agency, and
// booking site lays theirs out differently, and there's no checksum to
// validate against. This is plain regex/keyword heuristics, not real
// understanding of the document. It will miss fields on many real-world
// documents, and can occasionally pick up the wrong value. Every field
// returned here is a SUGGESTION only — the caller must always let the
// applicant review and correct it before it's used on any generated
// document. Never treat a result from this file as verified.
import "server-only";

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// ---- dates -----------------------------------------------------------------
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function isoIfValid(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  if (y < 100) y += 2000; // 2-digit year tickets ("26" -> 2026)
  if (y < 2000 || y > 2100) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}
// Tries, in order: YYYY-MM-DD, "15 AUG 2026" / "15 August 2026" (with or
// without a comma), the compact ticket style "15AUG26" / "15AUG2026", and
// "AUG 15, 2026". Returns the first match found anywhere in `text`, or "".
export function findFirstDateISO(text: string): string {
  let m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text);
  if (m) {
    const iso = isoIfValid(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) return iso;
  }
  const monthNames = Object.keys(MONTHS).join("|");
  m = new RegExp(`\\b(\\d{1,2})[\\s-]*(${monthNames})[a-z]*[\\s,-]*'?(\\d{2,4})\\b`, "i").exec(
    text
  );
  if (m) {
    const mon = MONTHS[m[2].toLowerCase()];
    const iso = isoIfValid(Number(m[3]), mon, Number(m[1]));
    if (iso) return iso;
  }
  m = new RegExp(`\\b(${monthNames})[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(\\d{2,4})\\b`, "i").exec(text);
  if (m) {
    const mon = MONTHS[m[1].toLowerCase()];
    const iso = isoIfValid(Number(m[3]), mon, Number(m[2]));
    if (iso) return iso;
  }
  return "";
}
// Same as above, but searched only within `text` (meant to be a narrow
// window around a label, e.g. "Check-in: 15AUG2026") so it doesn't grab an
// unrelated date elsewhere in the document. `labelTiers` is checked in
// order — e.g. for an arrival date, lines mentioning "ARRIVAL" are tried
// before falling back to a generic "DATE" line, so a document listing both a
// departure and arrival date doesn't grab the wrong one.
function dateNear(text: string, labelTiers: RegExp[][]): string {
  const ls = lines(text);
  for (const tier of labelTiers) {
    for (let i = 0; i < ls.length; i++) {
      if (tier.some((p) => p.test(ls[i]))) {
        const windowText = [ls[i], ls[i + 1] ?? ""].join(" ");
        const iso = findFirstDateISO(windowText);
        if (iso) return iso;
      }
    }
  }
  return "";
}

// ---- flight ------------------------------------------------------------
// A small set of carriers relevant to Korea<->Japan/Taiwan tourist routes, so
// a bare IATA code (always public, not fabricated) can be turned into a
// readable name when the document doesn't spell the airline out. Not
// exhaustive — unmatched codes are just left as-is.
const AIRLINE_CODES: Record<string, string> = {
  KE: "Korean Air",
  OZ: "Asiana Airlines",
  LJ: "Jin Air",
  TW: "T'way Air",
  "7C": "Jeju Air",
  BX: "Air Busan",
  RS: "Air Seoul",
  ZE: "Eastar Jet",
  NH: "All Nippon Airways",
  NX: "Air Macau",
  JL: "Japan Airlines",
  MM: "Peach Aviation",
  GK: "Jetstar Japan",
  CI: "China Airlines",
  BR: "EVA Air",
  JX: "StarLux Airlines",
  IT: "Tigerair Taiwan",
  AE: "Mandarin Airlines",
  B7: "AirAsia Zest",
};
// e.g. "KE123", "7C1200", "OZ 501" — a 2-character IATA airline code (two
// letters, or a digit+letter — never two digits, that's not a valid IATA
// code) immediately followed by (or separated by a space from) a 1-4 digit
// number.
const FLIGHT_NUMBER_RE = /\b([A-Z][A-Z0-9]|\d[A-Z])\s?(\d{1,4})\b/;

export type FlightReservationFields = {
  airline: string;
  flightNumber: string;
  arrivalAirportCode: string;
  arrivalDate: string; // YYYY-MM-DD, "" if not found
  // "HH:MM" 24h, "" if not found. Round trips list two legs; the first
  // departure/arrival pair belongs to the outbound leg, the last pair to
  // the return leg.
  departureTime: string;
  arrivalTime: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
};

// ---- times -----------------------------------------------------------------
// "10:55", "9:05 PM", "21:40", compact "2140" only when glued to a
// dep/arr label. Normalized to 24h "HH:MM".
const TIME_RE = /\b([01]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)?\b/i;

function normalizeTime(h: number, min: number, ampm?: string): string {
  if (ampm) {
    const up = ampm.toUpperCase();
    if (up === "PM" && h < 12) h += 12;
    if (up === "AM" && h === 12) h = 0;
  }
  return `${pad2(h)}:${pad2(min)}`;
}

function timesOnLine(line: string): string[] {
  const out: string[] = [];
  const re = new RegExp(TIME_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    out.push(normalizeTime(Number(m[1]), Number(m[2]), m[3]));
  }
  return out;
}

/**
 * Extracts departure/arrival times for up to two legs.
 *
 * Strategy, most-reliable first:
 *  1. Lines labeled DEPART…/ARRIV… — first labeled departure is the outbound
 *     leg, the last one the return leg (same for arrivals).
 *  2. Fallback: every time in the document, in order. Two times → one leg
 *     (dep, arr). Four or more → first two are the outbound leg, last two
 *     the return leg. Anything else is too ambiguous — return nothing
 *     rather than guess.
 */
function parseFlightTimes(text: string): {
  departureTime: string;
  arrivalTime: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
} {
  const ls = lines(text);
  const depTimes: string[] = [];
  const arrTimes: string[] = [];
  for (const l of ls) {
    // A line mentioning both DEP and ARR (e.g. "DEP 07:30  ARR 10:55")
    // contributes its first time to departures and last to arrivals.
    const isDep = /\bDEP(ART(URE)?)?\b|\bETD\b|출발/i.test(l);
    const isArr = /\bARR(IV(AL|E|ES)?)?\b|\bETA\b|도착/i.test(l);
    if (!isDep && !isArr) continue;
    const found = timesOnLine(l);
    if (found.length === 0) continue;
    if (isDep && isArr && found.length >= 2) {
      depTimes.push(found[0]);
      arrTimes.push(found[found.length - 1]);
    } else if (isDep) {
      depTimes.push(found[0]);
    } else {
      arrTimes.push(found[0]);
    }
  }

  if (depTimes.length > 0 || arrTimes.length > 0) {
    return {
      departureTime: depTimes[0] ?? "",
      arrivalTime: arrTimes[0] ?? "",
      returnDepartureTime: depTimes.length > 1 ? depTimes[depTimes.length - 1] : "",
      returnArrivalTime: arrTimes.length > 1 ? arrTimes[arrTimes.length - 1] : "",
    };
  }

  const all: string[] = [];
  for (const l of ls) all.push(...timesOnLine(l));
  if (all.length === 2) {
    return { departureTime: all[0], arrivalTime: all[1], returnDepartureTime: "", returnArrivalTime: "" };
  }
  if (all.length >= 4) {
    return {
      departureTime: all[0],
      arrivalTime: all[1],
      returnDepartureTime: all[all.length - 2],
      returnArrivalTime: all[all.length - 1],
    };
  }
  return { departureTime: "", arrivalTime: "", returnDepartureTime: "", returnArrivalTime: "" };
}

export function parseFlightReservation(rawText: string): FlightReservationFields {
  const text = rawText.toUpperCase();
  const ls = lines(text);

  let flightNumber = "";
  let airlineCode = "";
  for (const l of ls) {
    if (!/FLIGHT/.test(l)) continue;
    const m = FLIGHT_NUMBER_RE.exec(l);
    if (m) {
      airlineCode = m[1];
      flightNumber = `${m[1]}${m[2]}`;
      break;
    }
  }
  if (!flightNumber) {
    // Fall back to a document-wide scan — less reliable (no "FLIGHT" keyword
    // nearby), so only accept it if the code matches a carrier we recognize.
    const re = new RegExp(FLIGHT_NUMBER_RE, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (AIRLINE_CODES[m[1]]) {
        airlineCode = m[1];
        flightNumber = `${m[1]}${m[2]}`;
        break;
      }
    }
  }

  let airline = airlineCode ? (AIRLINE_CODES[airlineCode] ?? "") : "";
  if (!airline) {
    // A handful of airline names are sometimes printed in full even when the
    // code-based lookup above didn't fire (e.g. "FLIGHT" keyword absent).
    for (const [code, name] of Object.entries(AIRLINE_CODES)) {
      if (text.includes(name.toUpperCase())) {
        airline = name;
        if (!airlineCode) airlineCode = code;
        break;
      }
    }
  }

  // Arrival airport — a 3-letter code in parentheses that appears AFTER an
  // "ARRIVAL"/"TO:"-style label on the same line (not just anywhere on that
  // line — an itinerary line like "FROM: SEOUL (ICN) TO: TAIPEI (TPE)" has
  // two codes, and we want the one after "TO", not the departure one).
  // Falls back to the next line if the code isn't inline with the label.
  let arrivalAirportCode = "";
  for (let i = 0; i < ls.length; i++) {
    const label = /ARRIV[A-Z]*|TO\s*[:\-]|DESTINATION/.exec(ls[i]);
    if (!label) continue;
    const after = ls[i].slice(label.index + label[0].length);
    const m = /\(([A-Z]{3})\)/.exec(after) ?? /\(([A-Z]{3})\)/.exec(ls[i + 1] ?? "");
    if (m) {
      arrivalAirportCode = m[1];
      break;
    }
  }

  // Prefer a line actually labeled "arrival" over a generic "date" line, so
  // a document listing both departure and arrival dates doesn't grab the
  // departure date by mistake.
  const arrivalDate = dateNear(rawText, [[/ARRIV/i], [/DATE/i]]);
  const times = parseFlightTimes(rawText);

  return { airline, flightNumber, arrivalAirportCode, arrivalDate, ...times };
}

// ---- hotel -------------------------------------------------------------
export type HotelReservationFields = {
  name: string;
  address: string;
  phone: string;
  checkIn: string;
  checkOut: string;
};

const HOTEL_NAME_KEYWORDS = /\b(HOTEL|INN|RESORT|RYOKAN|GUESTHOUSE|HOSTEL|SUITES?|LODGE)\b/i;
// International phone-ish pattern: optional +country code, then 7-13 digits
// with optional spaces/dashes/parens. Area codes can be a single digit
// (e.g. Kaohsiung's "7"), so each group only needs 1+ digits, not 2+.
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?){1,5}\d{2,4}/;

export function parseHotelReservation(rawText: string): HotelReservationFields {
  const ls = lines(rawText);

  let name = "";
  for (const l of ls) {
    if (/^(HOTEL\s*NAME|PROPERTY\s*NAME|ACCOMMODATION)\s*[:\-]/i.test(l)) {
      name = l.replace(/^(HOTEL\s*NAME|PROPERTY\s*NAME|ACCOMMODATION)\s*[:\-]\s*/i, "").trim();
      break;
    }
  }
  if (!name) {
    const candidate = ls.find((l) => HOTEL_NAME_KEYWORDS.test(l) && l.length < 80);
    if (candidate) name = candidate.replace(/^(NAME|PROPERTY)\s*[:\-]\s*/i, "").trim();
  }

  let address = "";
  for (const l of ls) {
    if (/^ADDRESS\s*[:\-]/i.test(l)) {
      address = l.replace(/^ADDRESS\s*[:\-]\s*/i, "").trim();
      break;
    }
  }

  let phone = "";
  for (const l of ls) {
    if (!/PHONE|TEL\.?\s*[:\-]|CONTACT/i.test(l)) continue;
    const m = PHONE_RE.exec(l);
    if (m && m[0].replace(/\D/g, "").length >= 7) {
      phone = m[0].trim();
      break;
    }
  }

  const checkIn = dateNear(rawText, [[/CHECK[\s-]?IN/i]]);
  const checkOut = dateNear(rawText, [[/CHECK[\s-]?OUT/i]]);

  return { name, address, phone, checkIn, checkOut };
}
