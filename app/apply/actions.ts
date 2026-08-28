"use server";

import { revalidatePath } from "next/cache";
import { VISA_SUBMISSIONS_OPEN } from "@/lib/launch";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { documentsForStatus } from "@/lib/visa/config";
import {
  validateDates,
  japanProcessingType,
} from "@/lib/visa/destinations";
import { evaluateEligibility } from "@/lib/visa/eligibility";
import { resolveRuleset } from "@/lib/visa/rules-source";
import { APPLICANT_UPLOADS_BUCKET, applicantUploadPath } from "@/lib/supabase/storage";
import { sendEmail } from "@/lib/email/send";
import { resolveEmbassyClosures } from "@/lib/visa/embassyClosures-source";
import { isSubmissionDateBlocked } from "@/lib/visa/japanEmbassy";
import { submissionConfirmation, adminNotification } from "@/lib/email/templates";
import type { ApplyFormData } from "@/lib/visa/types";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// Find the user's most recent draft, or create a fresh one. Returns its id.
export async function getOrCreateDraft(): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { ok: true, data: { id: existing.id } };

  const { data: created, error } = await supabase
    .from("applications")
    .insert({
      user_id: session.user.id,
      status: "draft",
      client_email: session.user.email,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not create draft." };
  }
  return { ok: true, data: { id: created.id } };
}

// Starts a brand-new, empty application. Used by every "New application" /
// "Generate Documents" entry point so a fresh application NEVER inherits a
// previous draft's data. Existing drafts that already have a destination are
// preserved (resumable from the dashboard); only the user's untouched empty
// drafts are pruned to avoid clutter.
export async function createFreshDraft(): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  // Remove this user's empty drafts (never started — no destination/nationality).
  await supabase
    .from("applications")
    .delete()
    .eq("user_id", session.user.id)
    .eq("status", "draft")
    .is("destination_country", null)
    .is("nationality", null);

  const { data: created, error } = await supabase
    .from("applications")
    .insert({
      user_id: session.user.id,
      status: "draft",
      client_email: session.user.email,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not create application." };
  }
  return { ok: true, data: { id: created.id } };
}

function nullIfEmpty(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

// Surfaces DB errors clearly (never silently hides them). A "schema cache /
// column|relation not found" error means a migration (0006 Japan, 0007
// Taiwan) is either not applied OR applied but the PostgREST schema cache is
// stale. We log the full technical detail AND return an actionable message
// naming the exact fix.
function humanizeDbError(message: string): string {
  const schemaIssue =
    /schema cache|could not find the .*(column|table)|(column|relation) .* does not exist/i.test(
      message
    );
  if (schemaIssue) {
    console.error(
      "[db] SCHEMA MISMATCH — apply supabase/migrations/0006_japan_application.sql, 0007_taiwan_application.sql and 0012_vietnam_application.sql, then reload the PostgREST schema cache. Raw error:",
      message
    );
    return "We are updating our application system. Please save your draft and try again shortly. Our team has been notified.";
  }
  console.error("[db] Applicant application action failed:", message);
  return "We could not save your changes right now. Please try again.";
}

// Persist the wizard's data into applications + applicant_details + companions.
export async function saveApplication(
  applicationId: string,
  form: ApplyFormData
): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const ruleset = await resolveRuleset();

  // Derived fields (computed from the rule engine, never trusted from client).
  const stayDays = validateDates(
    form.destination_country,
    {
      planned_submission_date: form.planned_submission_date,
      travel_start_date: form.travel_start_date,
      travel_end_date: form.travel_end_date,
    },
    ruleset.dateRules
  ).stayDays;

  const processing =
    form.destination_country === "Japan"
      ? japanProcessingType(form.korea_region, form.current_korea_address)
      : null;

  // 1. applications (RLS ensures the row belongs to the user)
  const { error: appError } = await supabase
    .from("applications")
    .update({
      destination_country: nullIfEmpty(form.destination_country),
      destination_city: nullIfEmpty(form.destination_city),
      nationality: nullIfEmpty(form.nationality),
      korean_visa_status: nullIfEmpty(form.korean_visa_status),
      current_korea_address: nullIfEmpty(form.current_korea_address),
      city_region_detected: nullIfEmpty(form.korea_region),
      japan_processing_type: processing,
      stay_days: stayDays,
      client_email: nullIfEmpty(form.client_email),
      client_phone: nullIfEmpty(form.client_phone),
      planned_submission_date: nullIfEmpty(form.planned_submission_date),
      travel_start_date: nullIfEmpty(form.travel_start_date),
      travel_end_date: nullIfEmpty(form.travel_end_date),
      trip_reason: nullIfEmpty(form.trip_reason),
      // Japan trip-level fields (0006)
      travel_purpose: nullIfEmpty(form.travel_purpose),
      port_of_entry: nullIfEmpty(form.port_of_entry),
      flight_booked: form.flight_booked,
      accommodation_booked: form.accommodation_booked,
      has_previous_japan_visits: form.has_previous_japan_visits,
      host_type: nullIfEmpty(form.host_type),
      remarks: nullIfEmpty(form.remarks),
      background_answers: form.background_answers,
      // Taiwan trip-level fields (0007)
      taiwan_travel_purpose: nullIfEmpty(form.taiwan_travel_purpose),
      taiwan_travel_purpose_other: nullIfEmpty(form.taiwan_travel_purpose_other),
      taiwan_background_answers: form.taiwan_background_answers,
      // Vietnam trip-level fields (0012)
      vietnam_express_requested: form.vietnam_express_requested,
      vietnam_insurance_purchased: form.vietnam_insurance_purchased,
    })
    .eq("id", applicationId)
    .eq("user_id", session.user.id);

  if (appError) return { ok: false, error: humanizeDbError(appError.message) };

  // 2. applicant_details (one-to-one upsert)
  const { error: detailError } = await supabase
    .from("applicant_details")
    .upsert(
      {
        application_id: applicationId,
        surname: nullIfEmpty(form.surname),
        given_name: nullIfEmpty(form.given_name),
        middle_name_or_patronymic: nullIfEmpty(form.middle_name_or_patronymic),
        full_name_as_passport: nullIfEmpty(form.full_name_as_passport),
        nationality: nullIfEmpty(form.nationality),
        // Japan personal + passport + employment fields (0006)
        other_names: nullIfEmpty(form.other_names),
        former_nationality: nullIfEmpty(form.former_nationality),
        date_of_birth: nullIfEmpty(form.date_of_birth),
        birth_city: nullIfEmpty(form.birth_city),
        birth_state: nullIfEmpty(form.birth_state),
        country_of_birth: nullIfEmpty(form.country_of_birth),
        gender: nullIfEmpty(form.gender),
        marital_status: nullIfEmpty(form.marital_status),
        home_government_id: nullIfEmpty(form.home_government_id),
        passport_type: nullIfEmpty(form.passport_type),
        passport_number: nullIfEmpty(form.passport_number),
        passport_place_of_issue: nullIfEmpty(form.passport_place_of_issue),
        passport_issue_date: nullIfEmpty(form.passport_issue_date),
        passport_issuing_authority: nullIfEmpty(form.passport_issuing_authority),
        passport_expiry_date: nullIfEmpty(form.passport_expiry_date),
        occupation: nullIfEmpty(form.occupation),
        position_title: nullIfEmpty(form.position_title),
        employer_or_school_name: nullIfEmpty(form.employer_or_school_name),
        employer_or_school_address: nullIfEmpty(form.employer_or_school_address),
        employer_phone: nullIfEmpty(form.employer_phone),
        mobile: nullIfEmpty(form.mobile),
        spouse_or_parent_occupation: nullIfEmpty(form.spouse_or_parent_occupation),
        // Taiwan personal fields (0007)
        home_country_address: nullIfEmpty(form.home_country_address),
        home_country_phone: nullIfEmpty(form.home_country_phone),
        // Vietnam personal fields (0012)
        vietnam_family_member_name: nullIfEmpty(form.vietnam_family_member_name),
        vietnam_family_member_phone: nullIfEmpty(form.vietnam_family_member_phone),
        vietnam_family_member_address: nullIfEmpty(form.vietnam_family_member_address),
        vietnam_family_member_relationship: nullIfEmpty(
          form.vietnam_family_member_relationship
        ),
        vietnam_family_member_relationship_other: nullIfEmpty(
          form.vietnam_family_member_relationship_other
        ),
        vietnam_financing_source: nullIfEmpty(form.vietnam_financing_source),
        vietnam_financier_name: nullIfEmpty(form.vietnam_financier_name),
        vietnam_financier_relationship: nullIfEmpty(form.vietnam_financier_relationship),
        vietnam_financier_phone: nullIfEmpty(form.vietnam_financier_phone),
        vietnam_financier_address: nullIfEmpty(form.vietnam_financier_address),
      },
      { onConflict: "application_id" }
    );

  if (detailError) return { ok: false, error: humanizeDbError(detailError.message) };

  // 3. companions — replace the set for this application
  const { error: delError } = await supabase
    .from("companions")
    .delete()
    .eq("application_id", applicationId);
  if (delError) return { ok: false, error: delError.message };

  const companionRows = form.companions
    .filter((c) => c.full_name.trim() !== "")
    .map((c) => ({
      application_id: applicationId,
      full_name: c.full_name.trim(),
      nationality: nullIfEmpty(c.nationality),
      relationship: nullIfEmpty(c.relationship),
      passport_number: nullIfEmpty(c.passport_number),
      is_family_member: c.is_family_member,
    }));

  if (companionRows.length > 0) {
    const { error: compError } = await supabase
      .from("companions")
      .insert(companionRows);
    if (compError) return { ok: false, error: compError.message };
  }

  // 4. Japan child records (0006). Flight + host are 1:1 (upsert); accommodations
  // + previous visits are 1:many (replace the set, like companions).
  const flightErr = await saveJapanChildren(supabase, applicationId, form);
  if (flightErr) return { ok: false, error: humanizeDbError(flightErr) };

  revalidatePath("/apply");
  return { ok: true };
}

// Persists the Japan 1:1 (flight_bookings, japan_hosts) and 1:many
// (accommodations, previous_japan_visits) child records. Returns an error
// message on failure, or null on success.
async function saveJapanChildren(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  form: ApplyFormData
): Promise<string | null> {
  // Flight (1:1) — upsert.
  const { error: flightErr } = await supabase.from("flight_bookings").upsert(
    {
      application_id: applicationId,
      airline: nullIfEmpty(form.flight.airline),
      flight_number: nullIfEmpty(form.flight.flight_number),
      departure_airport: nullIfEmpty(form.flight.departure_airport),
      arrival_airport: nullIfEmpty(form.flight.arrival_airport),
      departure_date: nullIfEmpty(form.flight.departure_date),
      arrival_date: nullIfEmpty(form.flight.arrival_date),
      departure_time: nullIfEmpty(form.flight.departure_time),
      arrival_time: nullIfEmpty(form.flight.arrival_time),
      return_airline: nullIfEmpty(form.flight.return_airline),
      return_flight_number: nullIfEmpty(form.flight.return_flight_number),
      return_date: nullIfEmpty(form.flight.return_date),
      return_departure_time: nullIfEmpty(form.flight.return_departure_time),
      return_arrival_time: nullIfEmpty(form.flight.return_arrival_time),
    },
    { onConflict: "application_id" }
  );
  if (flightErr) return flightErr.message;

  // Accommodations (1:many) — replace the set.
  const { error: accDelErr } = await supabase
    .from("accommodations")
    .delete()
    .eq("application_id", applicationId);
  if (accDelErr) return accDelErr.message;

  const accRows = form.accommodations
    .filter((h) => [h.name, h.address, h.check_in].some((v) => v.trim() !== ""))
    .map((h, i) => ({
      application_id: applicationId,
      name: nullIfEmpty(h.name),
      address: nullIfEmpty(h.address),
      phone: nullIfEmpty(h.phone),
      check_in: nullIfEmpty(h.check_in),
      check_out: nullIfEmpty(h.check_out),
      sort_order: (i + 1) * 10,
    }));
  if (accRows.length > 0) {
    const { error } = await supabase.from("accommodations").insert(accRows);
    if (error) return error.message;
  }

  // Previous Japan visits (1:many) — replace the set.
  const { error: visitDelErr } = await supabase
    .from("previous_japan_visits")
    .delete()
    .eq("application_id", applicationId);
  if (visitDelErr) return visitDelErr.message;

  const visitRows = form.previous_japan_visits
    .filter((v) => [v.visited_from, v.visited_to, v.duration_note].some((x) => x.trim() !== ""))
    .map((v, i) => ({
      application_id: applicationId,
      visited_from: nullIfEmpty(v.visited_from),
      visited_to: nullIfEmpty(v.visited_to),
      duration_note: nullIfEmpty(v.duration_note),
      sort_order: (i + 1) * 10,
    }));
  if (visitRows.length > 0) {
    const { error } = await supabase.from("previous_japan_visits").insert(visitRows);
    if (error) return error.message;
  }

  // Host (1:1) — upsert when an inviter/guarantor applies, else clear it.
  if (form.host_type === "inviter" || form.host_type === "guarantor") {
    const { error } = await supabase.from("japan_hosts").upsert(
      {
        application_id: applicationId,
        role: nullIfEmpty(form.host.role),
        same_as_guarantor: form.host.same_as_guarantor,
        name: nullIfEmpty(form.host.name),
        address: nullIfEmpty(form.host.address),
        phone: nullIfEmpty(form.host.phone),
        date_of_birth: nullIfEmpty(form.host.date_of_birth),
        sex: nullIfEmpty(form.host.sex),
        relationship: nullIfEmpty(form.host.relationship),
        occupation: nullIfEmpty(form.host.occupation),
        nationality: nullIfEmpty(form.host.nationality),
        immigration_status: nullIfEmpty(form.host.immigration_status),
      },
      { onConflict: "application_id" }
    );
    if (error) return error.message;
  } else {
    const { error } = await supabase
      .from("japan_hosts")
      .delete()
      .eq("application_id", applicationId);
    if (error) return error.message;
  }

  return null;
}

// Uploads a document to Storage from the SERVER (service-role while auth is
// disabled). Browser-side storage uploads require a session that no longer
// exists, so the file is sent here as FormData and uploaded + recorded in one
// round-trip. Validates type/size server-side too.
export async function uploadApplicantFile(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  const applicationId = String(formData.get("applicationId") ?? "");
  const fileType = String(formData.get("fileType") ?? "");
  const required = formData.get("required") === "true";

  if (!(file instanceof File)) return { ok: false, error: "No file provided." };
  const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Only JPG, PNG, or PDF files are allowed." };
  }
  const maxMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 10;
  if (file.size / (1024 * 1024) > maxMb) {
    return { ok: false, error: `File is too large. Maximum size is ${maxMb}MB.` };
  }

  const supabase = await createClient();
  const path = applicantUploadPath(session.user.id, applicationId, fileType, file);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(APPLICANT_UPLOADS_BUCKET)
    .upload(path, buffer, { upsert: true, contentType: file.type });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: rowErr } = await supabase.from("uploaded_files").upsert(
    {
      application_id: applicationId,
      user_id: session.user.id,
      file_type: fileType,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type,
      size: file.size,
      required,
    },
    { onConflict: "application_id,file_type" }
  );
  if (rowErr) return { ok: false, error: rowErr.message };

  revalidatePath("/apply");
  return { ok: true, data: { path } };
}

// Records metadata after a successful browser-side upload to Storage.
export async function registerUploadedFile(input: {
  applicationId: string;
  fileType: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  required: boolean;
}): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase.from("uploaded_files").upsert(
    {
      application_id: input.applicationId,
      user_id: session.user.id,
      file_type: input.fileType,
      storage_path: input.storagePath,
      original_filename: input.originalFilename,
      mime_type: input.mimeType,
      size: input.size,
      required: input.required,
    },
    { onConflict: "application_id,file_type" }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/apply");
  return { ok: true };
}

// Removes an uploaded document: deletes the Storage object and its DB row.
// RLS (uploaded_files delete + applicant-uploads storage delete) restricts this
// to the owner; an admin may also delete.
export async function removeUploadedFile(input: {
  applicationId: string;
  fileType: string;
}): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("uploaded_files")
    .select("storage_path")
    .eq("application_id", input.applicationId)
    .eq("file_type", input.fileType)
    .maybeSingle();

  if (row?.storage_path) {
    await supabase.storage.from(APPLICANT_UPLOADS_BUCKET).remove([row.storage_path]);
  }

  const { error } = await supabase
    .from("uploaded_files")
    .delete()
    .eq("application_id", input.applicationId)
    .eq("file_type", input.fileType);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/apply");
  return { ok: true };
}

// Validates required docs + dates + consent, then flips the draft to
// "submitted". Consent is required — submission is blocked without it.
export async function submitApplication(
  applicationId: string,
  consent: boolean
): Promise<ActionResult> {
  // Submissions are closed until the payment system passes bank review; the
  // UI shows a launch notice, and this is the server's own copy of that rule.
  // The operator (admin role) may submit — they prepare client applications
  // by hand while the gate is closed.
  if (!VISA_SUBMISSIONS_OPEN) {
    const gateClient = await createClient();
    const {
      data: { user: gateUser },
    } = await gateClient.auth.getUser();
    const { data: gateProfile } = gateUser
      ? await gateClient.from("profiles").select("role").eq("id", gateUser.id).maybeSingle()
      : { data: null };
    if (gateProfile?.role !== "admin") {
      return { ok: false, error: "Submissions open soon — your application is saved as a draft." };
    }
  }

  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  if (!consent) {
    return { ok: false, error: "You must confirm you understand the rules before submitting." };
  }

  const supabase = await createClient();

  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select(
      "korean_visa_status, destination_country, nationality, planned_submission_date, travel_start_date, travel_end_date"
    )
    .eq("id", applicationId)
    .eq("user_id", session.user.id)
    .single();

  if (appErr || !app) {
    return { ok: false, error: appErr?.message ?? "Application not found." };
  }

  // marital_status lives on applicant_details (1:1 child row), not
  // applications — it's only needed here to decide which status-specific
  // documents (e.g. a spouse's ID for married applicants) are required.
  const { data: details } = await supabase
    .from("applicant_details")
    .select("marital_status")
    .eq("application_id", applicationId)
    .maybeSingle();
  // Vietnam's e-Visa flow never asks for a Korean visa status (the portal
  // doesn't want one), so requiring it here would block every Vietnam
  // submission. Every other destination still needs it — the status drives
  // their document checklist.
  const isVietnam = app.destination_country === "Vietnam";
  if (!app.destination_country || !app.nationality) {
    return { ok: false, error: "Please complete destination and nationality." };
  }
  if (!isVietnam && !app.korean_visa_status) {
    return {
      ok: false,
      error: "Please complete destination, nationality, and Korean visa status.",
    };
  }

  const ruleset = await resolveRuleset();

  // Visa-free travellers have no application to submit — block it server-side
  // so a crafted request can't bypass the wizard's gating.
  const eligibility = evaluateEligibility(
    app.nationality,
    app.destination_country,
    ruleset.eligibility,
    ruleset.demonyms
  );
  if (eligibility?.outcome === "visa_free") {
    return {
      ok: false,
      error: `${eligibility.summary} No visa application is required.`,
    };
  }

  // Re-validate dates on the server — the client cannot bypass these.
  const dateCheck = validateDates(
    app.destination_country,
    {
      planned_submission_date: app.planned_submission_date ?? "",
      travel_start_date: app.travel_start_date ?? "",
      travel_end_date: app.travel_end_date ?? "",
    },
    ruleset.dateRules
  );
  if (!dateCheck.ok) {
    const firstError = Object.values(dateCheck.errors)[0];
    return { ok: false, error: firstError ?? "Please fix the travel dates." };
  }

  // Submission-date closures are also checked on the server. This prevents a
  // crafted client request or an old saved date from bypassing the calendar.
  if (app.destination_country === "Japan" && app.planned_submission_date) {
    const closures = await resolveEmbassyClosures("Japan");
    if (isSubmissionDateBlocked(app.planned_submission_date, closures)) {
      return {
        ok: false,
        error: "The Embassy of Japan in Korea is closed on the selected submission date. Please choose another business day.",
      };
    }
  }

  const { data: files } = await supabase
    .from("uploaded_files")
    .select("file_type")
    .eq("application_id", applicationId);

  const uploaded = new Set((files ?? []).map((f) => f.file_type));
  // Vietnam has no Korean-visa-status document set — just the base identity
  // documents plus the 4×6 photo the e-Visa portal requires. Mirrors the
  // wizard's own gating so the client can't be blocked here by a rule it was
  // never shown.
  const requiredDocs = isVietnam
    ? [
        ...ruleset.baseDocuments,
        { key: "vietnam_photo", labelEn: "Photo, 4 × 6 cm", required: true },
      ]
    : documentsForStatus(
        app.korean_visa_status,
        ruleset.baseDocuments,
        ruleset.statusDocuments,
        details?.marital_status ?? undefined
      );
  const missing = requiredDocs
    .filter((d) => d.required && !uploaded.has(d.key))
    .map((d) => d.labelEn);

  if (missing.length > 0) {
    return { ok: false, error: `Missing required documents: ${missing.join(", ")}.` };
  }

  const { error: updErr } = await supabase
    .from("applications")
    .update({
      status: "submitted",
      consent_confirmed: true,
      consent_confirmed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", session.user.id);

  if (updErr) return { ok: false, error: updErr.message };

  // Transactional emails (no-op without RESEND_API_KEY; never block submit).
  const { data: detail } = await supabase
    .from("applicant_details")
    .select("full_name_as_passport")
    .eq("application_id", applicationId)
    .maybeSingle();
  const applicantName = detail?.full_name_as_passport ?? "";
  const clientEmail = session.user.email ?? "";

  const conf = submissionConfirmation({
    name: applicantName,
    destination: app.destination_country,
  });
  await sendEmail({ ...conf, to: clientEmail, applicationId });

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEmail) {
    const note = adminNotification({
      applicantName,
      destination: app.destination_country,
      email: clientEmail,
      applicationId,
    });
    await sendEmail({ ...note, to: adminEmail, applicationId });
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
