"use server";

// Passport auto-read (MRZ OCR). Reads the applicant's already-uploaded
// passport photo, extracts the machine-readable zone, and returns SUGGESTED
// field values. Nothing is written to the application here — the wizard
// shows the results and the applicant/agent must explicitly apply them
// (see PassportScanPanel.tsx). Same "never fabricate" principle as the rest
// of the document pipeline.
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { APPLICANT_UPLOADS_BUCKET } from "@/lib/supabase/storage";
import { scanPassportMrz, type PassportMrzFields } from "@/lib/ocr/passportMrz";
import { renderFirstPdfPageToPng } from "@/lib/ocr/pdfToImage";

export type ScanResult =
  | { ok: true; fields: PassportMrzFields; valid: boolean }
  | { ok: false; error: string };

const SUPPORTED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);

export async function scanUploadedPassport(applicationId: string): Promise<ScanResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("uploaded_files")
    .select("storage_path, mime_type")
    .eq("application_id", applicationId)
    .eq("file_type", "passport")
    .maybeSingle();

  if (rowErr) return { ok: false, error: rowErr.message };
  if (!row) return { ok: false, error: "Upload your passport photo page first." };

  if (!SUPPORTED_MIME.has(row.mime_type ?? "")) {
    return {
      ok: false,
      error: "Auto-read supports JPG, PNG, or PDF passport uploads only.",
    };
  }

  const { data: file, error: dlErr } = await supabase.storage
    .from(APPLICANT_UPLOADS_BUCKET)
    .download(row.storage_path);
  if (dlErr || !file) {
    return { ok: false, error: dlErr?.message ?? "Could not read the uploaded file." };
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());

  // PDFs (e.g. a phone-scanned passport page exported by CamScanner or
  // similar) have no pixels to OCR directly — rasterize the first page to a
  // PNG first, then run the same MRZ pipeline as any photo upload.
  if (row.mime_type === "application/pdf") {
    try {
      buffer = await renderFirstPdfPageToPng(buffer);
    } catch (e) {
      return {
        ok: false,
        error: `Could not read the uploaded PDF: ${(e as Error).message}`,
      };
    }
  }

  const result = await scanPassportMrz(buffer);
  if (!result.ok) return result;

  return { ok: true, fields: result.fields, valid: result.valid };
}
