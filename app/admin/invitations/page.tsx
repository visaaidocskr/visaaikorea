import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_BADGE,
  type InvitationStatus,
} from "@/lib/invite/types";

export const metadata: Metadata = { title: "Invitations · Admin" };

type Row = {
  id: string;
  status: InvitationStatus;
  inviter_full_name: string | null;
  korean_visa_status: string | null;
  submission_date: string | null;
  invitation_start_date: string | null;
  client_email: string | null;
  created_at: string;
  invitation_invitees: { id: string }[] | null;
};

export default async function AdminInvitationsPage() {
  // Defense in depth: the layout and proxy guard /admin, and this page
  // guards itself — RSC requests cannot skip past it. Cached per request.
  await requireAdmin();
  const supabase = await createClient();

  // Drafts are excluded: a half-filled form the client is still typing into
  // isn't work for us yet, and showing them buries the real queue.
  const { data } = await supabase
    .from("invitations")
    .select(
      "id, status, inviter_full_name, korean_visa_status, submission_date, invitation_start_date, client_email, created_at, invitation_invitees(id)"
    )
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Invitations</h1>
      <p className="mt-2 text-sm text-slate-600">
        Family visit requests (C-3-1). We prepare the Korea-side paperwork;
        the relative applies at the mission in their own country.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          No submitted invitations yet.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Inviter</th>
                <th className="px-5 py-3">Status in Korea</th>
                <th className="px-5 py-3">People</th>
                <th className="px-5 py-3">Submission</th>
                <th className="px-5 py-3">Visit</th>
                <th className="px-5 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/invitations/${r.id}`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {r.inviter_full_name || "—"}
                    </Link>
                    <div className="text-xs text-slate-400">{r.client_email}</div>
                  </td>
                  <td className="px-5 py-3">{r.korean_visa_status || "—"}</td>
                  <td className="px-5 py-3">{r.invitation_invitees?.length ?? 0}</td>
                  <td className="px-5 py-3">{r.submission_date || "—"}</td>
                  <td className="px-5 py-3">{r.invitation_start_date || "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${INVITATION_STATUS_BADGE[r.status]}`}
                    >
                      {INVITATION_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
