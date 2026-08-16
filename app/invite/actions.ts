"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import type { InviteFormData } from "@/lib/invite/types";
import { requirementsForStatus } from "@/lib/invite/requirements";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function nullIfEmpty(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

// Find the user's most recent invitation draft, or start a fresh one.
export async function getOrCreateInvitationDraft(): Promise<
  ActionResult<{ id: string }>
> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { ok: true, data: { id: existing.id } };

  const { data: created, error } = await supabase
    .from("invitations")
    .insert({
      user_id: session.user.id,
      status: "draft",
      client_email: session.user.email,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not start an invitation." };
  }
  return { ok: true, data: { id: created.id } };
}

// Saves the whole form. Invitees are replaced wholesale — there are only a
// handful per case, and it keeps ordering and deletions trivially correct.
export async function saveInvitation(
  invitationId: string,
  form: InviteFormData
): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  // The acknowledgement is stamped the moment it flips to true, together
  // with the status it was shown for — so what the client agreed to stays
  // provable even if the policy text changes later.
  const ackPatch = form.requirements_ack
    ? {
        requirements_ack: true,
        requirements_ack_at: new Date().toISOString(),
        requirements_ack_status: nullIfEmpty(form.korean_visa_status),
      }
    : { requirements_ack: false, requirements_ack_at: null, requirements_ack_status: null };

  const { error: headErr } = await supabase
    .from("invitations")
    .update({
      inviter_full_name: nullIfEmpty(form.inviter_full_name),
      inviter_nationality: nullIfEmpty(form.inviter_nationality),
      inviter_sex: nullIfEmpty(form.inviter_sex),
      inviter_date_of_birth: nullIfEmpty(form.inviter_date_of_birth),
      inviter_passport_number: nullIfEmpty(form.inviter_passport_number),
      inviter_phone: nullIfEmpty(form.inviter_phone),
      inviter_address_korea: nullIfEmpty(form.inviter_address_korea),
      korean_visa_status: nullIfEmpty(form.korean_visa_status),
      inviter_org_name: nullIfEmpty(form.inviter_org_name),
      inviter_position: nullIfEmpty(form.inviter_position),
      inviter_org_address: nullIfEmpty(form.inviter_org_address),
      submission_date: nullIfEmpty(form.submission_date),
      invitation_start_date: nullIfEmpty(form.invitation_start_date),
      invitation_end_date: nullIfEmpty(form.invitation_end_date),
      guarantee_months: form.guarantee_months || 3,
      destination_mission: form.destination_mission,
      reason_invitation: nullIfEmpty(form.reason_invitation),
      reason_statement: nullIfEmpty(form.reason_statement),
      reason_guarantee: nullIfEmpty(form.reason_guarantee),
      client_email: nullIfEmpty(form.client_email),
      ...ackPatch,
    })
    .eq("id", invitationId)
    .eq("user_id", session.user.id);

  if (headErr) return { ok: false, error: headErr.message };

  const { error: delErr } = await supabase
    .from("invitation_invitees")
    .delete()
    .eq("invitation_id", invitationId);
  if (delErr) return { ok: false, error: delErr.message };

  const rows = form.invitees
    .filter((p) => p.surname.trim() !== "" || p.given_name.trim() !== "")
    .map((p, i) => ({
      invitation_id: invitationId,
      sort_order: i,
      surname: nullIfEmpty(p.surname),
      given_name: nullIfEmpty(p.given_name),
      middle_name: nullIfEmpty(p.middle_name),
      date_of_birth: nullIfEmpty(p.date_of_birth),
      sex: nullIfEmpty(p.sex),
      nationality: nullIfEmpty(p.nationality),
      passport_number: nullIfEmpty(p.passport_number),
      address_home: nullIfEmpty(p.address_home),
      phone_home: nullIfEmpty(p.phone_home),
      relationship: nullIfEmpty(p.relationship),
    }));

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("invitation_invitees").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/invite");
  return { ok: true };
}

export async function submitInvitation(
  invitationId: string
): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("invitations")
    .select(
      "id, inviter_full_name, korean_visa_status, invitation_start_date, invitation_end_date, requirements_ack, client_email"
    )
    .eq("id", invitationId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!inv) return { ok: false, error: "Invitation not found." };

  const { count } = await supabase
    .from("invitation_invitees")
    .select("id", { count: "exact", head: true })
    .eq("invitation_id", invitationId);

  // Block rather than silently produce a half-document.
  const missing: string[] = [];
  if (!inv.inviter_full_name) missing.push("your full name");
  if (!inv.korean_visa_status) missing.push("your Korean visa status");
  if (!inv.invitation_start_date || !inv.invitation_end_date)
    missing.push("the visit dates");
  if (!count || count === 0) missing.push("at least one person to invite");
  if (!inv.requirements_ack) missing.push("confirmation that you read the document list");

  if (missing.length > 0) {
    return { ok: false, error: `Still needed: ${missing.join(", ")}.` };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "submitted" })
    .eq("id", invitationId)
    .eq("user_id", session.user.id);

  if (error) return { ok: false, error: error.message };

  // Email is best-effort; it must never block the submission itself.
  const verified = requirementsForStatus(inv.korean_visa_status ?? "").verified;
  const to = inv.client_email ?? session.user.email ?? "";
  if (to) {
    await sendEmail({
      to,
      applicationId: null,
      subject: "We received your invitation request",
      html: `<p>Thank you — we have your invitation request for ${count} ${
        count === 1 ? "person" : "people"
      }.</p><p>We are preparing your 초청장, 초청 사유서 and 신원보증서. ${
        verified
          ? "You can start gathering the documents on the list we showed you."
          : "Because we have not yet confirmed the document list for your residence status, our team will contact you with the exact list."
      }</p>`,
    });
  }

  revalidatePath("/invite");
  revalidatePath("/dashboard");
  return { ok: true };
}
