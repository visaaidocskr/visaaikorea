import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Email logs · Admin" };

function statusBadge(status: string | null) {
  const s = status ?? "";
  if (s === "sent") return "bg-emerald-100 text-emerald-700";
  if (s === "skipped") return "bg-slate-100 text-slate-500";
  return "bg-red-100 text-red-700";
}

export default async function AdminEmailLogsPage() {
  // Defense in depth: the layout and proxy guard /admin, and this page
  // guards itself — RSC requests cannot skip past it. Cached per request.
  await requireAdmin();
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("email_logs")
    .select("id, to_email, subject, status, sent_at")
    .order("sent_at", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Email logs</h1>
      <p className="mt-2 text-slate-600">
        Most recent {logs?.length ?? 0} email events. &quot;Skipped&quot; means
        no Resend API key was configured.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">To</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Sent</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-5 py-3 text-slate-600">{l.to_email}</td>
                <td className="px-5 py-3">{l.subject}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {new Date(l.sent_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  No email events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
