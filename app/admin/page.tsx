import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_BADGE, APPLICATION_STATUSES } from "@/lib/visa/status";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  // Defense in depth: the layout and proxy guard /admin, and this page
  // guards itself — RSC requests cannot skip past it. Cached per request.
  await requireAdmin();
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("applications")
    .select("status, flight_booked, accommodation_booked");

  const counts = new Map<string, number>();
  const INACTIVE = new Set(["draft", "completed", "rejected", "cancelled"]);
  let needsBookingCount = 0;
  for (const a of apps ?? []) {
    counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
    if (
      !INACTIVE.has(a.status) &&
      (a.flight_booked === false || a.accommodation_booked === false)
    ) {
      needsBookingCount += 1;
    }
  }
  const total = apps?.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Overview</h1>
      <p className="mt-2 text-slate-600">
        {total} application{total === 1 ? "" : "s"} in the system.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/applications?booking=missing"
          className={`rounded-3xl border p-6 shadow-sm transition ${
            needsBookingCount > 0
              ? "border-amber-300 bg-amber-50 hover:border-amber-400"
              : "border-slate-200 bg-white hover:border-blue-300"
          }`}
        >
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            ⚠ Needs booking help
          </span>
          <p className="mt-4 text-4xl font-extrabold">{needsBookingCount}</p>
        </Link>
        {APPLICATION_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/applications?status=${s}`}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
          >
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[s]}`}
            >
              {STATUS_LABELS[s]}
            </span>
            <p className="mt-4 text-4xl font-extrabold">{counts.get(s) ?? 0}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href="/admin/applications"
          className="rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800"
        >
          View all applications
        </Link>
      </div>
    </main>
  );
}
