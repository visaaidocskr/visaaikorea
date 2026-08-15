import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { documentsForStatus } from "@/lib/visa/config";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";
import { StatusControl } from "./StatusControl";
import { AddNoteForm } from "./AddNoteForm";
import { FileViewerButton } from "./FileViewerButton";
import { DocsPanel } from "./DocsPanel";

export const metadata: Metadata = { title: "Application · Admin" };

export default async function AdminApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!app) notFound();

  const [
    { data: details },
    { data: companions },
    { data: files },
    { data: notes },
    { data: generated },
    { data: templates },
  ] = await Promise.all([
    supabase.from("applicant_details").select("*").eq("application_id", id).maybeSingle(),
    supabase.from("companions").select("*").eq("application_id", id),
    supabase
      .from("uploaded_files")
      .select("file_type, original_filename, storage_path, size, required")
      .eq("application_id", id),
    supabase
      .from("admin_notes")
      .select("note, created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("generated_documents")
      .select("id, document_type, file_format, storage_path, generated_by, released")
      .eq("application_id", id)
      .order("generated_at", { ascending: false }),
    supabase
      .from("document_templates")
      .select("id, template_name")
      .eq("active", true)
      .or(`destination_country.eq.${app.destination_country},destination_country.is.null`),
  ]);

  const fileByType = new Map(
    (files ?? []).map((f) => [f.file_type, f] as const)
  );
  // marital_status lives on applicant_details (already fetched above as
  // `details`), not applications.
  const checklist = app.korean_visa_status
    ? documentsForStatus(
        app.korean_visa_status,
        undefined,
        undefined,
        details?.marital_status ?? undefined
      )
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin/applications" className="text-sm font-semibold text-blue-700">
        ← All applications
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">
          {details?.full_name_as_passport || app.client_email || "Application"}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[app.status as ApplicationStatus]}`}
        >
          {STATUS_LABELS[app.status as ApplicationStatus]}
        </span>
      </div>

      {/* Status control */}
      <Section title="Status">
        <StatusControl applicationId={id} current={app.status as ApplicationStatus} />
      </Section>

      {/* Destination & travel */}
      <Section title="Destination & travel">
        <Grid
          rows={[
            ["Destination", [app.destination_country, app.destination_city].filter(Boolean).join(" · ")],
            ["Japan route", app.japan_processing_type ?? "—"],
            ["Region detected", app.city_region_detected ?? "—"],
            ["Travel dates", [app.travel_start_date, app.travel_end_date].filter(Boolean).join(" → ")],
            ["Planned stay", app.stay_days != null ? `${app.stay_days} days` : "—"],
            ["Submission date", app.planned_submission_date ?? "—"],
            ["Travel purpose", app.travel_purpose ?? "—"],
            ["Consent", app.consent_confirmed ? `Yes (${app.consent_confirmed_at ? new Date(app.consent_confirmed_at).toLocaleString() : "—"})` : "No"],
          ]}
        />
      </Section>

      {/* Applicant */}
      <Section title="Applicant">
        <Grid
          rows={[
            ["Full name (passport)", details?.full_name_as_passport ?? "—"],
            ["Surname", details?.surname ?? "—"],
            ["Given name", details?.given_name ?? "—"],
            ["Middle / patronymic", details?.middle_name_or_patronymic ?? "—"],
            ["Nationality", app.nationality ?? details?.nationality ?? "—"],
            ["Korean visa status", app.korean_visa_status ?? "—"],
            ["Email", app.client_email ?? "—"],
            ["Phone", app.client_phone ?? "—"],
            ["Korea address", app.current_korea_address ?? "—"],
          ]}
        />
      </Section>

      {/* Companions */}
      {(companions ?? []).length > 0 && (
        <Section title={`Companions (${companions!.length})`}>
          <ul className="space-y-2">
            {companions!.map((c) => (
              <li key={c.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <span className="font-semibold">{c.full_name}</span>
                {c.relationship ? ` · ${c.relationship}` : ""}
                {c.nationality ? ` · ${c.nationality}` : ""}
                {c.is_family_member ? " · family" : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Document checklist + files */}
      <Section title="Documents">
        <div className="space-y-2">
          {checklist.map((doc) => {
            const f = fileByType.get(doc.key);
            return (
              <div
                key={doc.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {doc.labelEn}
                    {doc.required ? <span className="text-red-500"> *</span> : (
                      <span className="text-xs font-normal text-slate-400"> (optional)</span>
                    )}
                    {doc.labelKo ? <span className="text-sm text-slate-500"> · {doc.labelKo}</span> : null}
                  </p>
                  {f && (
                    <p className="text-xs text-slate-400">
                      {f.original_filename}
                      {f.size ? ` · ${(Number(f.size) / 1024 / 1024).toFixed(2)} MB` : ""}
                    </p>
                  )}
                </div>
                {f ? (
                  <FileViewerButton storagePath={f.storage_path} />
                ) : (
                  <span className="text-xs font-semibold text-amber-600">Not uploaded</span>
                )}
              </div>
            );
          })}
          {checklist.length === 0 && (
            <p className="text-sm text-slate-400">
              No visa status set yet — document checklist unavailable.
            </p>
          )}
        </div>
      </Section>

      {/* Generated documents / reservations */}
      <Section title="Generated documents & reservations">
        <DocsPanel
          applicationId={id}
          userId={app.user_id}
          documents={generated ?? []}
          templates={templates ?? []}
        />
      </Section>

      {/* Admin notes */}
      <Section title="Internal notes">
        <AddNoteForm applicationId={id} />
        <ul className="mt-5 space-y-3">
          {(notes ?? []).map((n, i) => (
            <li key={i} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <p className="text-slate-800">{n.note}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </li>
          ))}
          {(notes ?? []).length === 0 && (
            <li className="text-sm text-slate-400">No notes yet.</li>
          )}
        </ul>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
          <dt className="text-sm text-slate-500">{k}</dt>
          <dd className="text-right text-sm font-semibold text-slate-900">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
