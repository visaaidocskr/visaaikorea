"use server";

// Flight/hotel reservation auto-read. Mirrors app/apply/ocrActions.ts
// (passport MRZ scan) end to end — download the applicant's already-uploaded
// file, extract text, run a best-effort heuristic parser, and return
// SUGGESTED values only. Nothing is written to the application here; the
// wizard shows the results and the applicant/agent must explicitly apply
// them (see FlightScanPanel.tsx / HotelScanPanel.tsx). Unlike passport MRZ,
// there is no standard format or checksum for these documents, so results
// are lower-confidence by nature — every field stays fully editable.
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { APPLICANT_UPLOADS_BUCKET } from "@/lib/supabase/storage";
import { extractDocumentText } from "@/lib/ocr/documentText";
import {
  parseFlightReservation,
  parseHotelReservation,
  type FlightReservationFields,
  type HotelReservationFields,
} from "@/lib/ocr/reservationParse";
import { enforceRateLimit } from "@/lib/security/rateLimit";

const SUPPORTED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);

async function downloadUploadedFile(applicationId: string, fileType: string) {
  const supabase = await createClient();
  const { data: row, error: rowErr } = await supabase
    .from("uploaded_files")
    .select("storage_path, mime_type")
    .eq("application_id", applicationId)
    .eq("file_type", fileType)
    .maybeSingle();

  if (rowErr) {
    console.error("[reservation-ocr] Could not load upload record:", rowErr.message);
    return { ok: false as const, error: "We could not read that uploaded document. Please try again." };
  }
  if (!row) return { ok: false as const, error: "Upload the document first." };
  if (!SUPPORTED_MIME.has(row.mime_type ?? "")) {
    return { ok: false as const, error: "Auto-read supports JPG, PNG, or PDF uploads only." };
  }

  const { data: file, error: dlErr } = await supabase.storage
    .from(APPLICANT_UPLOADS_BUCKET)
    .download(row.storage_path);
  if (dlErr || !file) {
    console.error("[reservation-ocr] Could not download upload:", dlErr?.message);
    return { ok: false as const, error: "We could not read the uploaded file. Please try again." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true as const, buffer, mimeType: row.mime_type ?? "" };
}

export type FlightScanResult =
  | { ok: true; fields: FlightReservationFields }
  | { ok: false; error: string };

export async function scanUploadedFlightReservation(
  applicationId: string
): Promise<FlightScanResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };
  const limit = enforceRateLimit(`flight-ocr:${session.user.id}`, { limit: 6, windowMs: 60_000 });
  if (!limit.ok) return { ok: false, error: "Too many scans requested. Please wait a minute and try again." };

  const dl = await downloadUploadedFile(applicationId, "flight_reservation");
  if (!dl.ok) return { ok: false, error: dl.error };

  let text: string;
  try {
    text = await extractDocumentText(dl.buffer, dl.mimeType);
  } catch (e) {
    console.error("[reservation-ocr] Flight scan failed:", e);
    return { ok: false, error: "We could not read this flight document. Please complete the fields manually." };
  }

  const fields = parseFlightReservation(text);
  return { ok: true, fields };
}

export type HotelScanResult =
  | { ok: true; fields: HotelReservationFields }
  | { ok: false; error: string };

export async function scanUploadedHotelReservation(
  applicationId: string
): Promise<HotelScanResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };
  const limit = enforceRateLimit(`hotel-ocr:${session.user.id}`, { limit: 6, windowMs: 60_000 });
  if (!limit.ok) return { ok: false, error: "Too many scans requested. Please wait a minute and try again." };

  const dl = await downloadUploadedFile(applicationId, "hotel_booking");
  if (!dl.ok) return { ok: false, error: dl.error };

  let text: string;
  try {
    text = await extractDocumentText(dl.buffer, dl.mimeType);
  } catch (e) {
    console.error("[reservation-ocr] Hotel scan failed:", e);
    return { ok: false, error: "We could not read this hotel document. Please complete the fields manually." };
  }

  const fields = parseHotelReservation(text);
  return { ok: true, fields };
}
