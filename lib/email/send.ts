// Transactional email via Resend. Server-only.
// Degrades gracefully: with no RESEND_API_KEY, sends are skipped (and logged
// as "skipped") so the rest of the app keeps working in dev. Every attempt is
// written to email_logs using the service-role client (the table is admin-RLS,
// and senders may be acting as a client).
import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  applicationId?: string | null;
  attachments?: EmailAttachment[];
};

function fromAddress() {
  return process.env.RESEND_FROM ?? "VisaAI Korea <onboarding@resend.dev>";
}

async function logEmail(
  args: SendArgs,
  status: string,
  providerMessageId: string | null
) {
  try {
    const admin = createAdminClient();
    await admin.from("email_logs").insert({
      application_id: args.applicationId ?? null,
      to_email: args.to,
      subject: args.subject,
      status,
      provider_message_id: providerMessageId,
    });
  } catch {
    // logging must never break the caller
  }
}

export async function sendEmail(
  args: SendArgs
): Promise<{ ok: boolean; status: string }> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    await logEmail(args, "skipped", null);
    return { ok: false, status: "skipped" };
  }
  if (!args.to) {
    await logEmail(args, "no_recipient", null);
    return { ok: false, status: "no_recipient" };
  }

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.attachments && args.attachments.length > 0
        ? {
            attachments: args.attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            })),
          }
        : {}),
    });

    if (error) {
      await logEmail(args, `error: ${error.message}`, null);
      return { ok: false, status: "error" };
    }
    await logEmail(args, "sent", data?.id ?? null);
    return { ok: true, status: "sent" };
  } catch (e) {
    await logEmail(args, `error: ${(e as Error).message}`, null);
    return { ok: false, status: "error" };
  }
}
