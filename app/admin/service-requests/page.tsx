import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ServiceRequestActions } from "./ServiceRequestActions";
import type { EnquiryStatus } from "@/app/services/actions";

export const metadata: Metadata = { title: "Service requests · Admin" };

type RequestRow = {
  id: string; kind: "flight" | "tour"; full_name: string; email: string; phone: string;
  residential_address: string; origin_country: string; origin_city: string; destination_country: string;
  destination_city: string | null; departure_date: string; return_date: string | null; travellers: number;
  baggage_preference: string | null; hotel_stars: number | null; notes: string | null;
  status: EnquiryStatus; admin_quote: string | null; quoted_amount_usd: number | null; created_at: string;
};

export default async function ServiceRequestsPage() {
  // Defense in depth: the layout and proxy guard /admin, and this page
  // guards itself — RSC requests cannot skip past it. Cached per request.
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as RequestRow[];
  return <main className="mx-auto max-w-6xl px-6 py-10"><h1 className="text-3xl font-extrabold">Flight & tour requests</h1><p className="mt-2 text-slate-600">Requests awaiting an exact travel quotation. Sending a quote emails the client automatically.</p>{error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Could not load service requests. Check whether migration 0017 has been applied.</p>}<div className="mt-8 space-y-5">{rows.map((row) => <article key={row.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${row.kind === "flight" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>{row.kind === "flight" ? "✈️ flight" : "🌴 tour"}</span>
  <span className={row.status === "received" ? "text-red-600" : row.status === "quoted" ? "text-emerald-600" : "text-slate-500"}>{row.status}</span>
</p><h2 className="mt-1 text-xl font-extrabold">{row.full_name}</h2><p className="mt-1 text-sm text-slate-600">{row.email} · {row.phone}</p></div><p className="text-sm text-slate-500">{new Date(row.created_at).toLocaleString()}</p></div><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><Detail label="Route" value={`${row.origin_city}, ${row.origin_country} → ${row.destination_city || row.destination_country}, ${row.destination_country}`} /><Detail label="Dates" value={`${row.departure_date}${row.return_date ? ` → ${row.return_date}` : ""}`} /><Detail label="Travellers" value={`${row.travellers}${row.kind === "flight" ? ` · Baggage: ${row.baggage_preference ?? "—"}` : ` · ${row.hotel_stars}-star hotel`}`} /><Detail label="Address" value={row.residential_address || "—"} />{row.notes && <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Notes</p><p className="mt-1 whitespace-pre-line rounded-2xl bg-slate-50 px-4 py-3 leading-relaxed text-slate-700">{row.notes}</p></div>}</div><ServiceRequestActions id={row.id} status={row.status} quote={row.admin_quote} amount={row.quoted_amount_usd} /></article>)}{!error && rows.length === 0 && <p className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No flight or tour requests yet.</p>}</div></main>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 leading-relaxed text-slate-700">{value}</p></div>; }
