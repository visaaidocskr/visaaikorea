"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { GenBundle } from "@/lib/docs/templateData";
import {
  generateItineraryDoc,
  generateTravelPurposeDoc,
  generateApplicantListDoc,
  generateCoverLetterDoc,
  generateChecklistDoc,
} from "@/lib/docs/generators";
import { fillDocxTemplate } from "@/lib/docs/fillTemplate";
import { renderRouteToPdf } from "@/lib/docs/htmlToPdf";
import { createPrintToken } from "@/lib/docs/printToken";
import { getJapanDocumentPlan } from "@/lib/docs/japanRouting";
import { getJapanDocumentData } from "@/lib/docs/japanData";
import { fillJapanEvisaExcel } from "@/lib/docs/japanExcel";
import { sendEmail } from "@/lib/email/send";
import { documentsReady } from "@/lib/email/templates";
import { headers } from "next/headers";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PDF_MIME = "application/pdf";
const GENERATED_BUCKET = "generated-documents";
const TEMPLATES_BUCKET = "document-templates";

export type DocResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// Loads everything needed to generate documents for an application.
async function loadBundle(
  applicationId: string
): Promise<{ bundle: GenBundle; userId: string } | null> {
  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return null;

  const [{ data: details }, { data: companions }] = await Promise.all([
    supabase.from("applicant_details").select("*").eq("application_id", applicationId).maybeSingle(),
    supabase.from("companions").select("*").eq("application_id", applicationId),
  ]);

  return {
    bundle: { application, details, companions: companions ?? [] },
    userId: application.user_id,
  };
}

// Which system documents to generate for a given destination.
function planFor(bundle: GenBundle) {
  const dest = bundle.application.destination_country;
  const hasCompanions = bundle.companions.some((c) => (c.full_name ?? "").trim());

  const plan: { type: string; by: "ai" | "system"; make: () => Promise<Buffer> }[] = [
    { type: "Daily Travel Itinerary", by: "ai", make: () => generateItineraryDoc(bundle) },
    { type: "Travel Purpose Statement", by: "system", make: () => generateTravelPurposeDoc(bundle) },
  ];
  if (hasCompanions) {
    plan.push({ type: "List of Applicants", by: "system", make: () => generateApplicantListDoc(bundle) });
  }
  if (dest === "Spain") {
    plan.push({ type: "Cover Letter", by: "system", make: () => generateCoverLetterDoc(bundle) });
    plan.push({ type: "Schengen Support Checklist", by: "system", make: () => generateChecklistDoc(bundle) });
  }
  return plan;
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Generate all system documents for an application.
export async function generateDocuments(
  applicationId: string
): Promise<DocResult<{ count: number }>> {
  await requireAdmin();
  const loaded = await loadBundle(applicationId);
  if (!loaded) return { ok: false, error: "Application not found." };

  const { bundle, userId } = loaded;
  const admin = createAdminClient();
  const supabase = await createClient();
  const plan = planFor(bundle);

  // Generate + upload every document in parallel (they are independent), then
  // persist all rows in a single batched upsert. Previously this ran serially —
  // one generate→upload→insert per doc — so a Spain-with-companions bundle paid
  // up to ~15 sequential round-trips; now it's one parallel wave + one write.
  let rows: {
    application_id: string;
    document_type: string;
    file_format: string;
    storage_path: string;
    generated_by: string;
  }[];
  try {
    rows = await Promise.all(
      plan.map(async (item) => {
        let buffer: Buffer;
        try {
          buffer = await item.make();
        } catch (e) {
          throw new Error(`Failed to generate "${item.type}": ${(e as Error).message}`);
        }
        const path = `${userId}/${applicationId}/${slug(item.type)}.docx`;
        const { error: upErr } = await admin.storage
          .from(GENERATED_BUCKET)
          .upload(path, buffer, { contentType: DOCX_MIME, upsert: true });
        if (upErr) throw new Error(`Upload "${item.type}": ${upErr.message}`);
        return {
          application_id: applicationId,
          document_type: item.type,
          file_format: "docx",
          storage_path: path,
          generated_by: item.by,
        };
      })
    );
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const { error: rowErr } = await supabase
    .from("generated_documents")
    .upsert(rows, { onConflict: "application_id,document_type" });
  if (rowErr) return { ok: false, error: rowErr.message };

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true, data: { count: rows.length } };
}

// Fill an admin-uploaded .docx template and store the result.
export async function generateFromTemplate(
  applicationId: string,
  templateId: string
): Promise<DocResult> {
  await requireAdmin();
  const loaded = await loadBundle(applicationId);
  if (!loaded) return { ok: false, error: "Application not found." };

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: template } = await supabase
    .from("document_templates")
    .select("template_name, template_type, storage_path")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return { ok: false, error: "Template not found." };

  const { data: file, error: dlErr } = await admin.storage
    .from(TEMPLATES_BUCKET)
    .download(template.storage_path);
  if (dlErr || !file) return { ok: false, error: dlErr?.message ?? "Template download failed." };

  let output: Buffer;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    output = fillDocxTemplate(buf, loaded.bundle);
  } catch (e) {
    return { ok: false, error: `Template rendering failed: ${(e as Error).message}` };
  }

  const type = template.template_type || template.template_name;
  const path = `${loaded.userId}/${applicationId}/${slug(type)}.docx`;
  const { error: upErr } = await admin.storage
    .from(GENERATED_BUCKET)
    .upload(path, output, { contentType: DOCX_MIME, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: rowErr } = await supabase.from("generated_documents").upsert(
    {
      application_id: applicationId,
      document_type: type,
      file_format: "docx",
      storage_path: path,
      generated_by: "admin",
    },
    { onConflict: "application_id,document_type" }
  );
  if (rowErr) return { ok: false, error: rowErr.message };

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}

export async function toggleDocumentReleased(
  docId: string,
  released: boolean,
  applicationId: string
): Promise<DocResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("generated_documents")
    .update({ released })
    .eq("id", docId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}

export async function getGeneratedDocSignedUrl(
  storagePath: string
): Promise<DocResult<{ url: string }>> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(GENERATED_BUCKET)
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create link." };
  return { ok: true, data: { url: data.signedUrl } };
}

// Resend's hard cap is 40MB per email AFTER base64 encoding (~33% overhead).
// Stay well under that on raw bytes so we never hit a surprise send failure.
const MAX_ATTACHMENTS_BYTES = 20 * 1024 * 1024; // 20MB raw

const CONTENT_TYPE_BY_FORMAT: Record<string, string> = {
  pdf: PDF_MIME,
  docx: DOCX_MIME,
  xlsx: XLSX_MIME,
};

function attachmentFilename(documentType: string, storagePath: string): string {
  const ext = storagePath.split(".").pop() || "pdf";
  const base = documentType.replace(/[^A-Za-z0-9 ()&-]+/g, "").trim().replace(/\s+/g, "_");
  return `${base || "Document"}.${ext}`;
}

// Emails the client their released documents — attached directly when the
// combined size is reasonable, otherwise falls back to a "sign in to
// download" notice so a large package never silently fails to send.
export async function sendDocumentsReadyEmail(
  applicationId: string
): Promise<DocResult<{ status: string }>> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: app } = await supabase
    .from("applications")
    .select("client_email")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app?.client_email) return { ok: false, error: "No client email on file." };

  const { data: details } = await supabase
    .from("applicant_details")
    .select("full_name_as_passport")
    .eq("application_id", applicationId)
    .maybeSingle();

  const { data: docs } = await supabase
    .from("generated_documents")
    .select("document_type, file_format, storage_path")
    .eq("application_id", applicationId)
    .eq("released", true);

  if (!docs || docs.length === 0) {
    return { ok: false, error: "No released documents to notify about." };
  }

  // Download every released document from storage and attach it directly —
  // the client gets the files in-hand without needing to sign in.
  let attachments: { filename: string; content: Buffer; contentType?: string }[] = [];
  let totalBytes = 0;
  let downloadFailed = false;
  for (const doc of docs) {
    const { data: file, error } = await admin.storage
      .from(GENERATED_BUCKET)
      .download(doc.storage_path);
    if (error || !file) {
      downloadFailed = true;
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    totalBytes += buffer.length;
    attachments.push({
      filename: attachmentFilename(doc.document_type, doc.storage_path),
      content: buffer,
      contentType: CONTENT_TYPE_BY_FORMAT[doc.file_format ?? ""] ?? undefined,
    });
  }

  // Too large to attach safely — send the notification without attachments
  // instead of risking a provider-side rejection.
  const attached = attachments.length > 0 && totalBytes <= MAX_ATTACHMENTS_BYTES;
  if (!attached) attachments = [];

  const mail = documentsReady({
    name: details?.full_name_as_passport ?? "",
    count: docs.length,
    attached,
  });
  const res = await sendEmail({ ...mail, to: app.client_email, applicationId, attachments });
  revalidatePath(`/admin/applications/${applicationId}`);
  if (!res.ok) return { ok: false, error: `Email ${res.status}.` };
  const note = downloadFailed
    ? " (some documents failed to download and were left out)"
    : !attached && attachments.length === 0 && totalBytes > MAX_ATTACHMENTS_BYTES
      ? " (too large to attach — sent as a download link instead)"
      : "";
  return { ok: true, data: { status: `${res.status}${note}` } };
}

// Resolve the app's own base URL so the headless browser can reach the print
// route. Prefers the configured site URL; falls back to the request host.
async function resolveBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) throw new Error("Could not determine base URL for PDF rendering.");
  return `${proto}://${host}`;
}

// The official eVisa "Personal Information" Excel template.
const EVISA_EXCEL_TEMPLATE = "docs/TalkFile_일본비자_인적사항영_문_xlsx.xlsx";

// eVisa-only: a print-and-sign declaration page that accompanies the online
// application. No data fields — the applicant signs it by hand — so it's
// attached as-is, never for the sticker (Busan) route.
const EVISA_SIGNATURE_DECLARATION = "docs/TalkFile_온라인신청_서명란3_pdf.pdf";

function nameSlug(surname: string, given: string): string {
  const s = `${surname} ${given}`.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
  return s || "Applicant";
}

// Generate the correct Japan document for an application, driven ENTIRELY by the
// centralized routing/mapping in lib/docs/japanRouting.ts:
//   ARC jurisdiction → route (sticker | evisa) → template → mapped data → file.
// Never fabricates data: for the sticker form, if required fields are missing it
// refuses to generate and reports exactly which. Photo & signature are always
// left blank (the applicant adds them).
export async function generateJapanDocument(
  applicationId: string
): Promise<DocResult<{ route: string; documentType: string }>> {
  await requireAdmin();
  const admin = createAdminClient();
  const supabase = await createClient();

  // Load everything the routing + data mapper need (no raw DB fields touch the
  // PDF/render layer — they go through the mapper).
  const [
    { data: application },
    { data: details },
    { data: flight },
    { data: accommodations },
    { data: previousVisits },
    { data: host },
  ] = await Promise.all([
    admin.from("applications").select("*").eq("id", applicationId).maybeSingle(),
    admin.from("applicant_details").select("*").eq("application_id", applicationId).maybeSingle(),
    admin.from("flight_bookings").select("*").eq("application_id", applicationId).maybeSingle(),
    admin.from("accommodations").select("*").eq("application_id", applicationId).order("sort_order"),
    admin.from("previous_japan_visits").select("*").eq("application_id", applicationId).order("sort_order"),
    admin.from("japan_hosts").select("*").eq("application_id", applicationId).maybeSingle(),
  ]);
  if (!application) return { ok: false, error: "Application not found." };
  const userId = application.user_id as string;

  const plan = getJapanDocumentPlan({
    application,
    details,
    flight,
    accommodations: accommodations ?? undefined,
    previousVisits: previousVisits ?? undefined,
    host,
  });
  const who = nameSlug(plan.data.surname, plan.data.givenName);

  let buffer: Buffer;
  let documentType: string;
  let filename: string;
  let contentType = PDF_MIME;
  let fileFormat = "pdf";

  if (plan.route === "sticker") {
    const tpl = plan.templates.find((t) => t.template.id === "visa_application_form");
    if (!tpl) return { ok: false, error: "No sticker template resolved." };
    // Do NOT generate an incorrect form — report exactly what's missing.
    if (tpl.missing.length > 0) {
      return {
        ok: false,
        error: `Needs attention — the Visa Application Form is missing required information: ${tpl.missing
          .map((m) => m.label)
          .join(", ")}.`,
      };
    }
    // Faithful application form via the print route (photo/signature blank).
    try {
      const base = await resolveBaseUrl();
      const token = createPrintToken(applicationId);
      const url = `${base}/print/japan/${applicationId}?token=${encodeURIComponent(token)}`;
      buffer = await renderRouteToPdf(url);
    } catch (e) {
      return { ok: false, error: `PDF rendering failed: ${(e as Error).message}` };
    }
    documentType = "Japan Visa Application Form";
    filename = `Japan_Visa_Application_${who}.pdf`;
  } else {
    // eVisa route → fill the official Personal Information Excel template. Only
    // values are inserted (formatting/merges preserved); photo/signature areas
    // don't exist in this template, so nothing there is ever written.
    let template: Buffer;
    try {
      template = readFileSync(join(process.cwd(), EVISA_EXCEL_TEMPLATE));
    } catch (e) {
      return { ok: false, error: `Could not read the eVisa template: ${(e as Error).message}` };
    }
    const doc = getJapanDocumentData({
      application,
      details,
      flight,
      accommodations: accommodations ?? undefined,
      previousVisits: previousVisits ?? undefined,
      host,
    });
    const filled = fillJapanEvisaExcel(template, doc);
    if (!filled.ok) {
      return {
        ok: false,
        error: `Needs attention — the Personal Information form is missing required information: ${filled.missing.join(", ")}.`,
      };
    }
    buffer = filled.buffer;
    contentType = XLSX_MIME;
    fileFormat = "xlsx";
    documentType = "Japan Personal Information (eVisa)";
    filename = `Japan_Personal_Information_${who}.xlsx`;
  }

  // Clean, name-based storage basename → clean download filename.
  const path = `${userId}/${applicationId}/${filename}`;
  const { error: upErr } = await admin.storage
    .from(GENERATED_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: rowErr } = await supabase.from("generated_documents").upsert(
    {
      application_id: applicationId,
      document_type: documentType,
      file_format: fileFormat,
      storage_path: path,
      generated_by: "system",
    },
    { onConflict: "application_id,document_type" }
  );
  if (rowErr) return { ok: false, error: rowErr.message };

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true, data: { route: plan.route, documentType } };
}

// Uploads a generated buffer to storage + records it. Returns an error message
// or null. Shared by the package generator for the itinerary + checklist.
async function storeGeneratedDoc(input: {
  userId: string;
  applicationId: string;
  documentType: string;
  filename: string;
  buffer: Buffer;
  contentType: string;
  fileFormat: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  const supabase = await createClient();
  const path = `${input.userId}/${input.applicationId}/${input.filename}`;
  const up = await admin.storage
    .from(GENERATED_BUCKET)
    .upload(path, input.buffer, { contentType: input.contentType, upsert: true });
  if (up.error) return up.error.message;
  const row = await supabase.from("generated_documents").upsert(
    {
      application_id: input.applicationId,
      document_type: input.documentType,
      file_format: input.fileFormat,
      storage_path: path,
      generated_by: "system",
    },
    { onConflict: "application_id,document_type" }
  );
  return row.error ? row.error.message : null;
}

// One-click Japan visa package. Generates, per the resolved route:
//   • Route form  — Visa Application Form PDF (sticker) OR Personal Info Excel (eVisa)
//   • Japan Itinerary (DOCX)
//   • Document Checklist (PDF)
// All-or-nothing: if the route form's required fields are missing, nothing is
// generated and the exact missing fields are returned. Documents are saved to
// generated_documents; they reach the client only after the admin releases them.
export async function generateJapanPackage(
  applicationId: string
): Promise<DocResult<{ route: string; generated: string[] }>> {
  await requireAdmin();
  const admin = createAdminClient();

  const [
    { data: application },
    { data: details },
    { data: companions },
    { data: flight },
    { data: accommodations },
    { data: previousVisits },
    { data: host },
  ] = await Promise.all([
    admin.from("applications").select("*").eq("id", applicationId).maybeSingle(),
    admin.from("applicant_details").select("*").eq("application_id", applicationId).maybeSingle(),
    admin.from("companions").select("*").eq("application_id", applicationId),
    admin.from("flight_bookings").select("*").eq("application_id", applicationId).maybeSingle(),
    admin.from("accommodations").select("*").eq("application_id", applicationId).order("sort_order"),
    admin.from("previous_japan_visits").select("*").eq("application_id", applicationId).order("sort_order"),
    admin.from("japan_hosts").select("*").eq("application_id", applicationId).maybeSingle(),
  ]);
  if (!application) return { ok: false, error: "Application not found." };
  if (application.destination_country !== "Japan") {
    return { ok: false, error: "This action is for Japan applications only." };
  }
  const userId = application.user_id as string;

  const plan = getJapanDocumentPlan({
    application,
    details,
    flight,
    accommodations: accommodations ?? undefined,
    previousVisits: previousVisits ?? undefined,
    host,
  });

  // All-or-nothing: block the whole package if the route form is incomplete.
  const routeTpl = plan.templates[0];
  if (routeTpl && routeTpl.missing.length > 0) {
    return {
      ok: false,
      error: `Missing required information — complete these before generating the package: ${routeTpl.missing
        .map((m) => m.label)
        .join(", ")}.`,
    };
  }

  const who = nameSlug(plan.data.surname, plan.data.givenName);
  const generated: string[] = [];

  // 1. Route-specific application document (reuses the tested generator).
  const formRes = await generateJapanDocument(applicationId);
  if (!formRes.ok) return { ok: false, error: formRes.error };
  generated.push(formRes.data?.documentType ?? "Application document");

  // 1b. eVisa (Seoul) only: attach the signature declaration page as-is — no
  // fields to fill, the applicant prints and signs it by hand. Never attached
  // for the sticker (Busan) route.
  if (plan.route === "evisa") {
    try {
      const buffer = readFileSync(join(process.cwd(), EVISA_SIGNATURE_DECLARATION));
      const err = await storeGeneratedDoc({
        userId,
        applicationId,
        documentType: "Online Application — Declaration & Signature",
        filename: `Japan_Online_Declaration_${who}.pdf`,
        buffer,
        contentType: PDF_MIME,
        fileFormat: "pdf",
      });
      if (err) return { ok: false, error: `Declaration & Signature: ${err}` };
      generated.push("Online Application — Declaration & Signature");
    } catch (e) {
      return { ok: false, error: `Declaration & Signature: ${(e as Error).message}` };
    }
  }

  // 2. Daily Travel Itinerary (DOCX).
  try {
    const buffer = await generateItineraryDoc({
      application,
      details,
      companions: companions ?? [],
    });
    const err = await storeGeneratedDoc({
      userId,
      applicationId,
      documentType: "Japan Itinerary",
      filename: `Japan_Itinerary_${who}.docx`,
      buffer,
      contentType: DOCX_MIME,
      fileFormat: "docx",
    });
    if (err) return { ok: false, error: `Itinerary: ${err}` };
    generated.push("Japan Itinerary");
  } catch (e) {
    return { ok: false, error: `Itinerary generation failed: ${(e as Error).message}` };
  }

  // 3. Document Checklist (PDF via the print route).
  try {
    const base = await resolveBaseUrl();
    const token = createPrintToken(applicationId);
    const url = `${base}/print/japan-checklist/${applicationId}?token=${encodeURIComponent(token)}`;
    const buffer = await renderRouteToPdf(url);
    const err = await storeGeneratedDoc({
      userId,
      applicationId,
      documentType: "Japan Document Checklist",
      filename: `Japan_Checklist_${who}.pdf`,
      buffer,
      contentType: PDF_MIME,
      fileFormat: "pdf",
    });
    if (err) return { ok: false, error: `Checklist: ${err}` };
    generated.push("Japan Document Checklist");
  } catch (e) {
    return { ok: false, error: `Checklist generation failed: ${(e as Error).message}` };
  }

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true, data: { route: plan.route, generated } };
}

// NOTE: there is deliberately no Taiwan visa-application generator here.
//
// The R.O.C. has accepted only its own portal-generated form since 2012:
// the applicant's data is entered at visawebapp.boca.gov.tw, and the printout
// carries a scannable barcode that links the paper to the record in Taiwan's
// system. The mission declines "any other type of form". So a self-generated
// lookalike is useless (rejected on submission) and, if it imitated the
// barcode, would be forgery of an official document.
//
// The working process for Taiwan is therefore: the wizard collects every
// field, our staff enter them on the portal, and the resulting official PDF
// is emailed to the client to sign. Taiwan applications still receive the
// generic support documents (travel purpose statement, itinerary, checklist)
// through generateDocuments() like every other non-Japan destination.

// ONE-BUTTON generator. Auto-detects the destination and produces every
// document this application needs, with no manual choice required:
//   • Japan            → the full Japan package (official form + itinerary +
//                         checklist) PLUS the generic support letters
//                         (Travel Purpose Statement, List of Applicants).
//   • Any other country → the generic system document set (planFor).
// All-or-nothing per branch: if required fields are missing, nothing is
// generated and the exact missing fields are reported (never a fabricated or
// half-filled document).
export async function generateAllDocuments(
  applicationId: string
): Promise<DocResult<{ generated: string[] }>> {
  await requireAdmin();
  const loaded = await loadBundle(applicationId);
  if (!loaded) return { ok: false, error: "Application not found." };
  const { bundle, userId } = loaded;

  const generated: string[] = [];

  if (bundle.application.destination_country === "Japan") {
    const pkg = await generateJapanPackage(applicationId);
    if (!pkg.ok) return { ok: false, error: pkg.error };
    generated.push(...(pkg.data?.generated ?? []));

    try {
      const purposeBuf = await generateTravelPurposeDoc(bundle);
      const err = await storeGeneratedDoc({
        userId,
        applicationId,
        documentType: "Travel Purpose Statement",
        filename: "travel-purpose-statement.docx",
        buffer: purposeBuf,
        contentType: DOCX_MIME,
        fileFormat: "docx",
      });
      if (err) return { ok: false, error: `Travel Purpose Statement: ${err}` };
      generated.push("Travel Purpose Statement");

      if (bundle.companions.some((c) => (c.full_name ?? "").trim())) {
        const listBuf = await generateApplicantListDoc(bundle);
        const err2 = await storeGeneratedDoc({
          userId,
          applicationId,
          documentType: "List of Applicants",
          filename: "list-of-applicants.docx",
          buffer: listBuf,
          contentType: DOCX_MIME,
          fileFormat: "docx",
        });
        if (err2) return { ok: false, error: `List of Applicants: ${err2}` };
        generated.push("List of Applicants");
      }
    } catch (e) {
      return { ok: false, error: `Support documents failed: ${(e as Error).message}` };
    }
  } else {
    // Taiwan note: we deliberately do NOT produce a visa application form.
    // Since 2012 the R.O.C. accepts only the form generated by its own portal
    // (visawebapp.boca.gov.tw) — it carries a scannable barcode tying the
    // printout to the application record, and the mission declines any other
    // form. A lookalike would be rejected at best and forgery at worst, so the
    // application form is filled by our staff on the portal and emailed to the
    // client. The wizard still collects every Taiwan field, because that data
    // is what staff type into the portal.
    const res = await generateDocuments(applicationId);
    if (!res.ok) return { ok: false, error: res.error };
    generated.push(`${res.data?.count ?? 0} document(s)`);
  }

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true, data: { generated } };
}

// Records a reservation file the admin uploaded directly to storage.
export async function registerReservation(input: {
  applicationId: string;
  documentType: string;
  storagePath: string;
}): Promise<DocResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("generated_documents").upsert(
    {
      application_id: input.applicationId,
      document_type: input.documentType,
      file_format: "pdf",
      storage_path: input.storagePath,
      generated_by: "admin",
    },
    { onConflict: "application_id,document_type" }
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/applications/${input.applicationId}`);
  return { ok: true };
}
