import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_BADGE,
  type InvitationStatus,
} from "@/lib/invite/types";
import { requirementsForStatus } from "@/lib/invite/requirements";
import {
  InvitationActions,
  DocumentLink,
} from "@/app/admin/invitations/[id]/InvitationActions";

export const metadata: Metadata = { title: "Invitation · Admin" };

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-900">
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function AdminInvitationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Defense in depth: the layout and proxy guard /admin, and this page
  // guards itself — RSC requests cannot skip past it. Cached per request.
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: inv }, { data: invitees }, { data: docs }] = await Promise.all([
    supabase.from("invitations").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("invitation_invitees")
      .select("*")
      .eq("invitation_id", id)
      .order("sort_order"),
    supabase
      .from("invitation_documents")
      .select("id, document_type, released, generated_at")
      .eq("invitation_id", id)
      .order("generated_at", { ascending: false }),
  ]);

  if (!inv) notFound();

  const requirements = requirementsForStatus(inv.korean_visa_status ?? "");
  const documents = docs ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin/invitations" className="text-sm font-semibold text-blue-700">
        ← Invitations
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">
          {inv.inviter_full_name || "Invitation"}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${INVITATION_STATUS_BADGE[inv.status as InvitationStatus]}`}
        >
          {INVITATION_STATUS_LABELS[inv.status as InvitationStatus]}
        </span>
      </div>

      {!requirements.verified && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          We haven&rsquo;t confirmed the document list for{" "}
          <strong>{inv.korean_visa_status || "this status"}</strong>. The client
          was told our team would send it — that still needs doing.
        </p>
      )}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-bold">Inviter</h2>
        <dl>
          <Field label="Full name" value={inv.inviter_full_name} />
          <Field label="Nationality" value={inv.inviter_nationality} />
          <Field label="Date of birth" value={inv.inviter_date_of_birth} />
          <Field label="Korean visa status" value={inv.korean_visa_status} />
          <Field label="Phone" value={inv.inviter_phone} />
          <Field label="Address in Korea" value={inv.inviter_address_korea} />
          <Field label="Organisation" value={inv.inviter_org_name} />
          <Field label="Position" value={inv.inviter_position} />
          <Field label="Email" value={inv.client_email} />
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-bold">The visit</h2>
        <dl>
          <Field label="Documents handed in" value={inv.submission_date} />
          <Field
            label="Visit"
            value={
              inv.invitation_start_date
                ? `${inv.invitation_start_date} → ${inv.invitation_end_date}`
                : null
            }
          />
          <Field label="Guarantee" value={`${inv.guarantee_months} months`} />
          <Field label="Documents addressed to" value={inv.destination_mission} />
          <Field
            label="Read the requirements"
            value={
              inv.requirements_ack
                ? `Yes — ${new Date(inv.requirements_ack_at).toLocaleString()} (shown for ${inv.requirements_ack_status ?? "—"})`
                : "No"
            }
          />
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-bold">
          People invited ({invitees?.length ?? 0})
        </h2>
        <div className="space-y-4">
          {(invitees ?? []).map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-bold">
                {[p.surname, p.given_name, p.middle_name].filter(Boolean).join(" ")}
              </p>
              <dl className="mt-2">
                <Field label="Relationship" value={p.relationship} />
                <Field label="Date of birth" value={p.date_of_birth} />
                <Field label="Passport" value={p.passport_number} />
                <Field label="Address" value={p.address_home} />
                <Field label="Phone" value={p.phone_home} />
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold">What the client wrote</h2>
        <p className="mb-4 text-xs text-slate-500">
          In their own language. This is translated into formal Korean when the
          documents are generated — check the result before releasing.
        </p>
        <div className="space-y-4">
          {[
            ["Why they are inviting", inv.reason_invitation],
            ["Life at home / ties", inv.reason_statement],
            ["What the inviter covers", inv.reason_guarantee],
          ].map(([label, text]) => (
            <div key={label as string}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {label}
              </h3>
              <p className="mt-1 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {(text as string) || "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Documents</h2>

        <InvitationActions invitationId={id} hasDocuments={documents.length > 0} />

        {documents.length > 0 && (
          <div className="mt-6 space-y-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-800">
                  {d.document_type}
                  {d.released && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      Released
                    </span>
                  )}
                </span>
                <DocumentLink documentId={d.id} label="Open" />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
