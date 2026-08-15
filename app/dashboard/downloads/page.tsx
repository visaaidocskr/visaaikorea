import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DownloadButton } from "@/app/dashboard/DownloadButton";

export const metadata: Metadata = { title: "Downloads · VisaAI Korea" };

type Row = {
  id: string;
  document_type: string;
  file_format: string | null;
  application_id: string;
  applications: { destination_country: string | null } | { destination_country: string | null }[] | null;
};

function destOf(r: Row): string {
  const a = r.applications;
  if (!a) return "";
  const one = Array.isArray(a) ? a[0] : a;
  return one?.destination_country ?? "";
}

export default async function DownloadsPage() {
  await requireUser();
  const supabase = await createClient();

  // RLS limits this to the user's own released documents.
  const { data } = await supabase
    .from("generated_documents")
    .select("id, document_type, file_format, application_id, applications(destination_country)")
    .eq("released", true)
    .order("generated_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-extrabold">Downloads</h1>
      <p className="mt-2 text-slate-600">All documents released to you, across applications.</p>

      <div className="mt-6 space-y-2">
        {rows.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-semibold">{d.document_type}</p>
              <Link
                href={`/dashboard/applications/${d.application_id}`}
                className="text-xs text-blue-700 hover:underline"
              >
                {destOf(d) || "View application"}
              </Link>
            </div>
            <DownloadButton documentId={d.id} />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            No documents have been released to you yet.
          </p>
        )}
      </div>
    </main>
  );
}
