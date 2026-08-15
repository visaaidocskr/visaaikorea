"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { APPLICANT_UPLOADS_BUCKET } from "@/lib/supabase/storage";
import { APPLICATION_STATUSES } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";

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
