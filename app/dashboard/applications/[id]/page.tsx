import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";
import { DownloadButton } from "@/app/dashboard/DownloadButton";
import { APPROVED_VISA_DOC_TYPE } from "@/lib/docs/documentTypes";
import { GenerateItineraryButton } from "@/app/dashboard/GenerateItineraryButton";

export const metadata: Metadata = { title: "Application · VisaAI Korea" };

export default async function ClientApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  // RLS guarantees the client can only read their own application.
  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!app) notFound();

  const { data: docs } = await supabase
    .from("generated_documents")
    .select("id, document_type, file_format, released")
    .eq("application_id", id)
    .eq("released", true)
    .order("generated_at", { ascending: false });

  // Submission only flips the status badge — the underlying data stays
  // editable (saveApplication/RLS place no restriction on status), so let
  // the client fix/add details (e.g. a missing field our team flagged)
  // any time before the case is closed out.
  const canEdit = !["completed", "cancelled", "rejected", "visa_granted"].includes(
    app.status
  );

  // Where "fix this" should land. Japan/Taiwan use the richer flow, where the
  // documents and personal fields live on their own pages; everywhere else
  // it's all on the single "Applicant" page.
  const fixStepName = ["Japan", "Taiwan"].includes(app.destination_country ?? "")
    ? "Identity Documents"
    : "Applicant";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/dashboard/applications" className="text-sm font-semibold text-blue-700">
        ← My applications
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">
          {[app.destination_country, app.destination_city].filter(Boolean).join(" · ") ||
            "Application"}
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[app.status as ApplicationStatus]}`}
          >
            {STATUS_LABELS[app.status as ApplicationStatus]}
          </span>
          {canEdit && (
            <Link
              href={`/apply?app=${id}`}
              className="rounded-full bg-blue-700 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-blue-800"
            >
              Edit application
            </Link>
          )}
        </div>
      </div>

      {/* What the team needs from the applicant, in their own words. Shown
          above everything else — a status badge alone ("Missing documents")
          tells them something is wrong but not what, which is worse than
          saying nothing. */}
      {app.client_message && (
        <section
          className={`mt-6 rounded-3xl border p-6 ${
            app.status === "missing_documents"
              ? "border-amber-300 bg-amber-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <h2
            className={`text-lg font-bold ${
              app.status === "missing_documents" ? "text-amber-900" : "text-blue-900"
            }`}
          >
            {app.status === "missing_documents"
              ? "Action needed from you"
              : "A message from our team"}
          </h2>
          <p
            className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${
              app.status === "missing_documents" ? "text-amber-900" : "text-blue-900"
            }`}
          >
            {app.client_message}
          </p>
          {canEdit && (
            <Link
              // Land on the page with the fields and uploads, not back on
              // Destination — the applicant is here to fix something specific.
              href={`/apply?app=${id}&step=${encodeURIComponent(fixStepName)}`}
              className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Open my application to fix this
            </Link>
          )}
          {app.client_message_at && (
            <p
              className={`mt-3 text-xs ${
                app.status === "missing_documents" ? "text-amber-700" : "text-blue-700"
              }`}
            >
              Sent {new Date(app.client_message_at).toLocaleString()}
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Summary</h2>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            // Vietnam never asks for a Korean visa status — showing an empty
            // row would look like the applicant forgot to fill something in.
            ...(app.korean_visa_status
              ? [["Korean visa status", app.korean_visa_status]]
              : []),
            ["Nationality", app.nationality],
            ["Travel dates", [app.travel_start_date, app.travel_end_date].filter(Boolean).join(" → ")],
            ["Planned stay", app.stay_days != null ? `${app.stay_days} days` : "—"],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-sm text-slate-500">{k}</dt>
              <dd className="text-right text-sm font-semibold">{(v as string) || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold">
          {app.destination_country === "Vietnam" ? "Your e-Visa" : "Your documents"}
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {app.destination_country === "Vietnam"
            ? "Your approved e-Visa is emailed to you as a PDF, and also appears here once it has been issued by the Vietnam Immigration Department."
            : "Documents appear here once our team has prepared and released them. Air ticket and hotel reservations may arrive within 16 hours after review."}
        </p>
        {app.destination_country === "Japan" &&
          app.travel_start_date &&
          app.travel_end_date && (
            <div className="mb-4">
              <GenerateItineraryButton applicationId={id} />
            </div>
          )}
        <div className="space-y-2">
          {(docs ?? []).map((d) => {
            // The issued visa is the thing they came for — make it obvious
            // among any supporting documents in the same list.
            const isVisa = d.document_type === APPROVED_VISA_DOC_TYPE;
            return (
              <div
                key={d.id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  isVisa
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200"
                }`}
              >
                <span className={`font-semibold ${isVisa ? "text-emerald-900" : ""}`}>
                  {isVisa ? "✓ Your visa" : d.document_type}
                  <span className="ml-2 text-xs uppercase text-slate-400">
                    {d.file_format}
                  </span>
                </span>
                <DownloadButton documentId={d.id} />
              </div>
            );
          })}
          {(docs ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              No documents available yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
