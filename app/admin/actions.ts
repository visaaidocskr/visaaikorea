"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { APPLICANT_UPLOADS_BUCKET } from "@/lib/supabase/storage";
import { APPLICATION_STATUSES } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";
import { sendEmail } from "@/lib/email/send";
import { clientMessage } from "@/lib/email/templates";

export type AdminResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// Best-effort audit trail. Never blocks the primary action on failure.
async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata_json: metadata ?? null,
    });
  } catch {
    // swallow — auditing must not break admin operations
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!APPLICATION_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };

  await audit(user.id, "application.status_changed", "application", applicationId, {
    status,
  });
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin/applications");
  return { ok: true };
}

/**
 * Saves a message the CLIENT will see on their application page, and emails
 * it to them.
 *
 * Deliberately separate from addAdminNote: admin_notes is admin-only by RLS,
 * so notes written there never reach the applicant. Setting a status like
 * "Missing documents" without this leaves them with an amber badge and no
 * idea which document is wrong.
 *
 * Passing an empty message clears the current one (i.e. "nothing outstanding
 * any more") rather than being rejected.
 */
export async function setClientMessage(
  applicationId: string,
  message: string
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const trimmed = message.trim();

  const supabase = await createClient();
  const { data: app, error } = await supabase
    .from("applications")
    .update({
      client_message: trimmed || null,
      client_message_at: trimmed ? new Date().toISOString() : null,
    })
    .eq("id", applicationId)
    .select("client_email, destination_country, status")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  // Only email when there's something to say. Email failure must not lose the
  // message — it's already saved and visible in the dashboard either way.
  if (trimmed && app?.client_email) {
    const { data: details } = await supabase
      .from("applicant_details")
      .select("full_name_as_passport")
      .eq("application_id", applicationId)
      .maybeSingle();

    const mail = clientMessage({
      name: details?.full_name_as_passport ?? "",
      destination: app.destination_country ?? "your",
      message: trimmed,
      needsAction: app.status === "missing_documents",
    });
    await sendEmail({ ...mail, to: app.client_email, applicationId });
  }

  await audit(user.id, "application.client_message_set", "application", applicationId);
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { ok: true };
}

export async function addAdminNote(
  applicationId: string,
  note: string
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Note cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("admin_notes").insert({
    application_id: applicationId,
    admin_id: user.id,
    note: trimmed,
  });

  if (error) return { ok: false, error: error.message };

  await audit(user.id, "application.note_added", "application", applicationId);
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}

// Short-lived signed URL for an uploaded file. Admin-only; uses the
// service-role client so it works regardless of per-object RLS nuance.
export async function getUploadSignedUrl(
  storagePath: string
): Promise<AdminResult<{ url: string }>> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(APPLICANT_UPLOADS_BUCKET)
    .createSignedUrl(storagePath, 60 * 10); // 10 minutes

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create link." };
  }
  return { ok: true, data: { url: data.signedUrl } };
}

export async function setUserRole(
  targetUserId: string,
  role: "client" | "admin"
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (targetUserId === user.id) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", targetUserId);

  if (error) return { ok: false, error: error.message };

  await audit(user.id, "user.role_changed", "profile", targetUserId, { role });
  revalidatePath("/admin/users");
  return { ok: true };
}
