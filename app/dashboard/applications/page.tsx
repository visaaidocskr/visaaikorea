import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";

export const metadata: Metadata = { title: "My Applications · VisaAI Korea" };

export default async function MyApplicationsPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("applications")
    .select("id, destination_country, destination_city, status, travel_start_date, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">My applications</h1>
        <Link
          href="/apply?new=1"
          className="rounded-2xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
        >
          New application
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {(apps ?? []).map((a) => (
          <Link
            key={a.id}
            // Drafts resume into the wizard; submitted apps open their status page.
            href={
              a.status === "draft"
                ? `/apply?app=${a.id}`
                : `/dashboard/applications/${a.id}`
            }
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
          >
            <div>
              <p className="font-bold">
                {[a.destination_country, a.destination_city].filter(Boolean).join(" · ") ||
                  "Draft application"}
              </p>
              <p className="text-sm text-slate-500">
                {a.travel_start_date ? `Travel from ${a.travel_start_date}` : "No travel date yet"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[a.status as ApplicationStatus]}`}
            >
              {STATUS_LABELS[a.status as ApplicationStatus]}
            </span>
          </Link>
        ))}
        {(apps ?? []).length === 0 && (
          <p className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            You have no applications yet.
          </p>
        )}
      </div>
    </main>
  );
}
