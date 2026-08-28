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

// --- Schedule of Stay (체류일정표) ------------------------------------------
// Mirrors the official embassy form: dated header, bilingual intro naming
// the applicant and companion count, a companion list, and a four-column
// table (Date / Activity plan / Contact number / Accommodations address).
// Day plans come from the deterministic geography-aware engine — each day
// stays inside one neighborhood cluster — framed by real flight and hotel
// details from the application. "Same as above" repeats, exactly like a
// hand-prepared agency schedule.

const CITY_AIRPORTS: Record<string, { name: string; code: string }> = {
  Tokyo: { name: "Narita International Airport", code: "NRT" },
  Osaka: { name: "Kansai International Airport", code: "KIX" },
  Fukuoka: { name: "Fukuoka Airport", code: "FUK" },
  Taipei: { name: "Taoyuan International Airport", code: "TPE" },
  Taichung: { name: "Taichung International Airport", code: "RMQ" },
  Kaohsiung: { name: "Kaohsiung International Airport", code: "KHH" },
  Singapore: { name: "Singapore Changi Airport", code: "SIN" },
  Madrid: { name: "Adolfo Suárez Madrid–Barajas Airport", code: "MAD" },
  Barcelona: { name: "Josep Tarradellas Barcelona–El Prat Airport", code: "BCN" },
  Valencia: { name: "Valencia Airport", code: "VLC" },
  Hanoi: { name: "Noi Bai International Airport", code: "HAN" },
  "Ho Chi Minh City": { name: "Tan Son Nhat International Airport", code: "SGN" },
  "Da Nang": { name: "Da Nang International Airport", code: "DAD" },
};

const COUNTRY_KO: Record<string, string> = {
  Japan: "일본",
  Taiwan: "대만",
  Singapore: "싱가포르",
  Spain: "스페인",
  Vietnam: "베트남",
};

// "2026-09-01" -> "2026.09.01" (the format the embassy sample uses).
function dotDate(iso: string): string {
  return iso.replaceAll("-", ".");
}

function scheduleCell(
  paragraphs: Paragraph[],
  widthPct: number,
  opts?: { shaded?: boolean }
) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.TOP,
    shading: opts?.shaded ? { fill: "F1F5F9" } : undefined,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: paragraphs,
  });
}

function activityLine(text: string, last = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    spacing: { after: last ? 0 : 140 },
  });
}

function smallText(text: string) {
  return new Paragraph({ children: [new TextRun({ text, size: 20 })] });
}

function smallBoldText(text: string) {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] });
}

function headerCellPair(en: string, ko: string, widthPct: number) {
  return scheduleCell(
    [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: en, bold: true, size: 20 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: ko, size: 18, color: "475569" })],
      }),
    ],
    widthPct,
    { shaded: true }
  );
}

export async function generateItineraryDoc(bundle: GenBundle): Promise<Buffer> {
  const data = buildTemplateData(bundle);
  const a = data.application;
  const country = a.destination_country || "Japan";
  const city = a.destination_city || "";
  const flight = bundle.flight ?? null;
  const accommodations = (bundle.accommodations ?? []).filter(
    (acc) => (acc.name ?? "").trim() !== "" || (acc.address ?? "").trim() !== ""
  );

  const days = data.itinerary_days;
  if (days.length === 0) {
    throw new Error("Invalid travel dates: end date must be on or after start date.");
  }

  const airport = CITY_AIRPORTS[city] ?? CITY_AIRPORTS[country] ?? null;
  const arrivalAirportText =
    (flight?.arrival_airport ?? "").trim() ||
    (airport ? `${airport.name} (${airport.code})` : `${city || country} international airport`);
  const departureAirportText =
    (flight?.departure_airport ?? "").trim() || "Incheon International Airport (ICN)";
  const outboundFlight = [flight?.airline, flight?.flight_number]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const returnFlight = [flight?.return_airline, flight?.return_flight_number]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const departureTime = (flight?.departure_time ?? "").trim();
  const arrivalTime = (flight?.arrival_time ?? "").trim();
  const returnDepartureTime = (flight?.return_departure_time ?? "").trim();
  const returnArrivalTime = (flight?.return_arrival_time ?? "").trim();
  // "HH:MM" -> minutes since midnight, or null when unknown/invalid.
  const toMinutes = (t: string): number | null => {
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const arrivalMin = toMinutes(arrivalTime);
  const returnDepMin = toMinutes(returnDepartureTime);

  // The hotel covering a given date; falls back to the first one so the
  // column never sits empty when dates were left loose.
  function accommodationFor(dateISO: string) {
    const hit = accommodations.find((acc) => {
      const ci = (acc.check_in ?? "").trim();
      const co = (acc.check_out ?? "").trim();
      if (!ci) return false;
      return dateISO >= ci && (co === "" || dateISO < co || dateISO === ci);
    });
    return hit ?? accommodations[0] ?? null;
  }

  // Header: writing date, embassy style.
  const now = new Date();
  const seoul = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  const [wy, wm, wd] = seoul.split("-");

  const applicantName = (data.applicant.full_name || "—").toUpperCase();
  const companions = data.companions;
  const othersCount = companions.length;
  const koCountry = COUNTRY_KO[country] ?? country;

  const introEn =
    othersCount > 0
      ? `The schedules of stay in ${country} of the visa applicant ${applicantName} and ${othersCount} other${othersCount === 1 ? "" : "s"} are as follows:`
      : `The schedule of stay in ${country} of the visa applicant ${applicantName} is as follows:`;
  const introKo =
    othersCount > 0
      ? `신청인인 ${applicantName} 외 ${othersCount}명의 ${koCountry} 체류일정표는 다음과 같습니다.`
      : `신청인인 ${applicantName}의 ${koCountry} 체류일정표는 다음과 같습니다.`;

  // --- Activity plans per day ---------------------------------------------
  function activityParagraphs(dayIndex: number): Paragraph[] {
    const d = days[dayIndex];
    const first = dayIndex === 0;
    const last = dayIndex === days.length - 1 && days.length > 1;
    const acc = accommodationFor(d.date);
    const hotelName = (acc?.name ?? "").trim();
    const lines: string[] = [];

    if (first) {
      lines.push(
        `Depart from ${departureAirportText}${departureTime ? ` (${departureTime})` : ""} to ${arrivalAirportText}${outboundFlight ? ` — flight ${outboundFlight}` : ""}`
      );
      lines.push(`Arrive in ${city || country}${arrivalTime ? ` (${arrivalTime})` : ""}`);
      lines.push(`Transfer to hotel${hotelName ? ` (${hotelName})` : ""} and check-in`);
      // Shape the rest of the arrival day around the landing time: a morning
      // arrival leaves a full afternoon; a late-afternoon arrival leaves only
      // the evening; an evening arrival is check-in and dinner, nothing more.
      if (arrivalMin === null || arrivalMin < 14 * 60) {
        lines.push(`Afternoon: ${d.afternoon}`);
        lines.push(`Evening: ${d.evening}, dinner at a local restaurant nearby`);
      } else if (arrivalMin < 18 * 60) {
        lines.push(`Evening: ${d.evening}, dinner at a local restaurant nearby`);
      } else {
        lines.push("Evening: rest at the hotel, dinner at a local restaurant nearby");
      }
      if (days.length === 1) {
        lines.push(`Transfer to ${arrivalAirportText} and depart for Incheon International Airport (ICN)`);
      }
    } else if (last) {
      // The departure day follows the return flight's clock: an early flight
      // is checkout-and-transfer only; a midday flight allows a short walk;
      // only an evening flight leaves room for real free time.
      if (returnDepMin !== null && returnDepMin < 12 * 60) {
        lines.push("Early breakfast and check-out from hotel");
        lines.push(`Transfer to ${arrivalAirportText} (about 3 hours before departure)`);
      } else if (returnDepMin !== null && returnDepMin < 17 * 60) {
        lines.push("Breakfast and check-out from hotel");
        lines.push("Short walk near the hotel");
        lines.push(`Transfer to ${arrivalAirportText}`);
      } else if (returnDepMin !== null) {
        lines.push("Breakfast and check-out from hotel");
        lines.push(`Free time: ${d.morning}`);
        lines.push(`Transfer to ${arrivalAirportText}`);
      } else {
        // Unknown flight time — stay conservative rather than promising a
        // sightseeing morning the ticket may not allow.
        lines.push("Breakfast and check-out from hotel");
        lines.push(`Transfer to ${arrivalAirportText}`);
      }
      lines.push(
        `Depart ${city || country}${returnDepartureTime ? ` (${returnDepartureTime})` : ""} → Arrive Incheon International Airport (ICN)${returnArrivalTime ? ` (${returnArrivalTime})` : ""}${returnFlight ? ` — flight ${returnFlight}` : ""}`
      );
    } else {
      lines.push("Breakfast at hotel");
      lines.push(`Morning: ${d.morning}`);
      lines.push("Lunch at a local restaurant nearby");
      lines.push(`Afternoon: ${d.afternoon}`);
      lines.push(`Evening: ${d.evening}`);
      lines.push("Return to hotel");
    }
    return lines.map((text, i) => activityLine(text, i === lines.length - 1));
  }

  // --- Table rows -----------------------------------------------------------
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCellPair("Date", "날짜", 14),
      headerCellPair("Activity plan", "여행 계획", 46),
      headerCellPair("Contact number", "연락처", 17),
      headerCellPair("Accommodations address", "숙소 명 및 주소", 23),
    ],
  });

  let prevPhone: string | null = null;
  let prevStay: string | null = null;
  const dayRows = days.map((d, i) => {
    const acc = accommodationFor(d.date);
    const phone = (acc?.phone ?? "").trim() || "—";
    const stayName = (acc?.name ?? "").trim();
    const stayAddr = (acc?.address ?? "").trim();
    const stay = [stayName, stayAddr].filter(Boolean).join("\n") || "—";

    const phoneText = phone === prevPhone ? "Same as above" : phone;
    const stayRepeat = stay === prevStay;
    prevPhone = phone;
    prevStay = stay;

    // Hotel name in bold above the plain-text address, mirroring the bold
    // column header — repeated rows collapse to "Same as above".
    const stayParagraphs = stayRepeat
      ? [smallText("Same as above")]
      : stayName || stayAddr
        ? [
            ...(stayName ? [smallBoldText(stayName)] : []),
            ...(stayAddr ? [smallText(stayAddr)] : []),
          ]
        : [smallText("—")];

    return new TableRow({
      cantSplit: true,
      children: [
        scheduleCell([smallText(dotDate(d.date))], 14),
        scheduleCell(activityParagraphs(i), 46),
        scheduleCell([smallText(phoneText)], 17),
        scheduleCell(stayParagraphs, 23),
      ],
    });
  });

  // --- Companions block -----------------------------------------------------
  const companionLines: Paragraph[] = [];
  for (let i = 0; i < Math.max(5, companions.length); i++) {
    const c = companions[i];
    const text = c
      ? `${i + 1}. ${c.full_name.toUpperCase()}${c.relationship ? ` — ${c.relationship}` : ""}`
      : `${i + 1}.`;
    companionLines.push(
      new Paragraph({ children: [new TextRun({ text, size: 20 })], spacing: { after: 60 } })
    );
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${wy} (Year)  ${wm} (Month)  ${wd} (Day)`, size: 20 }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Schedule of stay", bold: true, size: 32 })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: introEn, size: 20 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: introKo, size: 19, color: "475569" })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Name of companion and relationship with applicant", bold: true, size: 20 }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "동행자 성명 및 신청인과의 관계(반드시 여권상 영문명으로 기재)",
          size: 18,
          color: "475569",
        }),
      ],
      spacing: { after: 120 },
    }),
    ...companionLines,
    new Paragraph({ text: "", spacing: { after: 120 } }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dayRows] }),
  ];

  // No agency disclaimer here — this document is submitted to the embassy/
  // consulate as the applicant's own travel plan.
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
