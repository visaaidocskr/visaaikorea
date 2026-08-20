import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DESTINATIONS } from "@/lib/visa/config";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE,
} from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";

export const metadata: Metadata = { title: "Applications · Admin" };

type SearchParams = {
  q?: string;
  status?: string;
  destination?: string;
  from?: string;
  to?: string;
  booking?: string;
};

type Joined = { full_name_as_passport: string | null };
type Row = {
  id: string;
  status: ApplicationStatus;
  destination_country: string | null;
  nationality: string | null;
  client_email: string | null;
  client_phone: string | null;
  created_at: string;
  flight_booked: boolean | null;
  accommodation_booked: boolean | null;
  applicant_details: Joined | Joined[] | null;
};

// True when the applicant told us they still haven't booked their flight
// and/or accommodation. Never inferred from missing/null data — only an
// explicit "No" counts, so we never flag an application that simply hasn't
// reached that step yet.
function needsBooking(r: Row): boolean {
  return r.flight_booked === false || r.accommodation_booked === false;
}
function bookingLabel(r: Row): string {
  const missing = [
    r.flight_booked === false ? "flight" : null,
    r.accommodation_booked === false ? "hotel" : null,
  ].filter(Boolean);
  return missing.length ? `Needs ${missing.join(" + ")}` : "";
}

// The 1:1 join may arrive as an object or a single-element array.
function applicantName(r: Row): string | null {
  const ad = r.applicant_details;
  if (!ad) return null;
  const one = Array.isArray(ad) ? ad[0] : ad;
  return one?.full_name_as_passport ?? null;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Defense in depth: the layout and proxy guard /admin, and this page
  // guards itself — RSC requests cannot skip past it. Cached per request.
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select(
      "id, status, destination_country, nationality, client_email, client_phone, created_at, flight_booked, accommodation_booked, applicant_details(full_name_as_passport)"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.destination) query = query.eq("destination_country", sp.destination);
  if (sp.from) query = query.gte("created_at", sp.from);
  if (sp.to) query = query.lte("created_at", `${sp.to}T23:59:59`);
  if (sp.booking === "missing") {
    query = query.or("flight_booked.eq.false,accommodation_booked.eq.false");
  }

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  // Free-text search across name / email / phone / nationality (in-memory:
  // admin volume is low and it spans a joined table).
  const q = (sp.q ?? "").trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [applicantName(r), r.client_email, r.client_phone, r.nationality]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q))
      )
    : rows;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Applications</h1>

      {/* Filters — plain GET form, no client JS */}
      <form className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-5">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Name, email, phone, nationality"
          className="rounded-xl border border-slate-300 px-4 py-2.5 md:col-span-2"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-xl border border-slate-300 px-4 py-2.5"
        >
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="destination"
          defaultValue={sp.destination ?? ""}
          className="rounded-xl border border-slate-300 px-4 py-2.5"
        >
          <option value="">All destinations</option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="booking"
            value="missing"
            defaultChecked={sp.booking === "missing"}
            className="h-4 w-4"
          />
          Needs booking help only
        </label>
        <div className="flex gap-2 md:col-span-5">
          <button className="rounded-xl bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800">
            Apply filters
          </button>
          <Link
            href="/admin/applications"
            className="rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Reset
          </Link>
        </div>
      </form>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
          {error.message}
        </p>
      )}

      <p className="mt-6 text-sm text-slate-500">
        {filtered.length} result{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Applicant</th>
              <th className="px-5 py-3">Destination</th>
              <th className="px-5 py-3">Nationality</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Booking</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-slate-100 hover:bg-slate-50 ${
                  needsBooking(r) ? "bg-amber-50/60" : ""
                }`}
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/applications/${r.id}`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {applicantName(r) || r.client_email || "—"}
                  </Link>
                  <div className="text-xs text-slate-400">{r.client_email}</div>
                </td>
                <td className="px-5 py-3">{r.destination_country ?? "—"}</td>
                <td className="px-5 py-3">{r.nationality ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[r.status]}`}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {needsBooking(r) ? (
                    <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      ⚠ {bookingLabel(r)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  No applications match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
