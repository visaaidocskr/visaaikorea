"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeKoreanLetter, type LetterContext } from "@/lib/ai/koreanLetter";
import {
  generateInvitationPackage,
  type InviteDocData,
} from "@/lib/docs/inviteDocs";

const GENERATED_BUCKET = "generated-documents";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type DocResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Filenames need to survive a Korean filesystem and a Windows download
// folder, so strip everything that isn't a plain latin word character.
function nameSlug(...parts: string[]): string {
  const joined = parts.filter(Boolean).join("_");
  const cleaned = joined.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "invitee";
}

/**
 * Produces the one combined Korea-side document (신원보증서 + 초청장, the
 * mission's own two-form package) for every person on an invitation.
 *
 * All-or-nothing per person: if a document fails we stop and report it,
 * rather than releasing a partial set that looks complete.
 */
export async function generateInvitationDocuments(
  invitationId: string
): Promise<DocResult<{ generated: string[] }>> {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: inv }, { data: invitees }] = await Promise.all([
    admin.from("invitations").select("*").eq("id", invitationId).maybeSingle(),
    admin
      .from("invitation_invitees")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("sort_order"),
  ]);

  if (!inv) return { ok: false, error: "Invitation not found." };
  if (!invitees || invitees.length === 0) {
    return { ok: false, error: "This invitation has nobody on it yet." };
  }

  const userId = inv.user_id as string;
  const generated: string[] = [];

  for (const p of invitees) {
    const inviteeName = [s(p.surname), s(p.given_name), s(p.middle_name)]
      .filter(Boolean)
      .join(" ");

    const ctx: LetterContext = {
      inviterName: s(inv.inviter_full_name),
      inviterStatus: s(inv.korean_visa_status),
      inviteeNames: [inviteeName],
      relationship: s(p.relationship),
      visitStart: s(inv.invitation_start_date),
      visitEnd: s(inv.invitation_end_date),
    };

    // Translate each answer into formal Korean. A null result (no API key,
    // or the call failed) leaves the body empty, and the generators fall
    // back to their fixed sentences rather than printing the client's
    // untranslated text on a document going to an embassy.
    const [bodyInvitation, bodyStatement, bodyGuarantee] = await Promise.all([
      writeKoreanLetter(s(inv.reason_invitation), "invitation", ctx),
      writeKoreanLetter(s(inv.reason_statement), "statement", ctx),
      writeKoreanLetter(s(inv.reason_guarantee), "guarantee", ctx),
    ]);

    const data: InviteDocData = {
      inviter: {
        full_name: s(inv.inviter_full_name),
        nationality: s(inv.inviter_nationality),
        sex: s(inv.inviter_sex),
        date_of_birth: s(inv.inviter_date_of_birth),
        passport_number: s(inv.inviter_passport_number),
        phone: s(inv.inviter_phone),
        address_korea: s(inv.inviter_address_korea),
        korean_visa_status: s(inv.korean_visa_status),
        org_name: s(inv.inviter_org_name),
        position: s(inv.inviter_position),
        org_address: s(inv.inviter_org_address),
      },
      invitee: {
        surname: s(p.surname),
        given_name: s(p.given_name),
        middle_name: s(p.middle_name),
        date_of_birth: s(p.date_of_birth),
        sex: s(p.sex),
        nationality: s(p.nationality),
        passport_number: s(p.passport_number),
        address_home: s(p.address_home),
        phone_home: s(p.phone_home),
        relationship: s(p.relationship),
      },
      invitation_start_date: s(inv.invitation_start_date),
      invitation_end_date: s(inv.invitation_end_date),
      guarantee_months: (inv.guarantee_months as number) ?? 3,
      destination_mission: s(inv.destination_mission),
      submission_date: s(inv.submission_date),
      body_invitation: bodyInvitation ?? "",
      body_statement: bodyStatement ?? "",
      body_guarantee: bodyGuarantee ?? "",
    };

    const who = nameSlug(s(p.surname), s(p.given_name));
    const docs: { type: string; file: string; buffer: Buffer }[] = [
      {
        type: `신원보증서·초청장 — ${inviteeName}`,
        file: `Invitation_Package_${who}.docx`,
        buffer: await generateInvitationPackage(data),
      },
    ];

    for (const d of docs) {
      const path = `${userId}/invitations/${invitationId}/${d.file}`;
      const up = await admin.storage
        .from(GENERATED_BUCKET)
        .upload(path, d.buffer, { contentType: DOCX_MIME, upsert: true });
      if (up.error) return { ok: false, error: `${d.file}: ${up.error.message}` };

      const row = await admin.from("invitation_documents").upsert(
        {
          invitation_id: invitationId,
          invitee_id: p.id,
          document_type: d.type,
          file_format: "docx",
          storage_path: path,
          generated_by: "system",
        },
        { onConflict: "invitation_id,invitee_id,document_type" }
      );
      if (row.error) return { ok: false, error: `${d.file}: ${row.error.message}` };

      generated.push(d.type);
    }
  }

  await admin
    .from("invitations")
    .update({ status: "documents_generating" })
    .eq("id", invitationId);

  revalidatePath(`/admin/invitations/${invitationId}`);
  return { ok: true, data: { generated } };
}

/** Makes the generated documents visible to the client. */
export async function releaseInvitationDocuments(
  invitationId: string
): Promise<DocResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("invitation_documents")
    .update({ released: true })
    .eq("invitation_id", invitationId);
  if (error) return { ok: false, error: error.message };

  await admin
    .from("invitations")
    .update({ status: "completed" })
    .eq("id", invitationId);

  revalidatePath(`/admin/invitations/${invitationId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Short-lived signed URL for an admin to open a generated document. */
export async function invitationDocumentUrl(
  documentId: string
): Promise<DocResult<{ url: string }>> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: doc } = await admin
    .from("invitation_documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  const { data, error } = await admin.storage
    .from(GENERATED_BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 10);
  if (error || !data) return { ok: false, error: error?.message ?? "Could not sign URL." };

  return { ok: true, data: { url: data.signedUrl } };
}
