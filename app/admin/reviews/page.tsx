import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reviews · Admin" };

type ReviewRow = {
  id: string;
  user_id: string | null;
  context: "visa_application" | "flight_request" | "tour_request" | "invite_request";
  rating: number;
  comment: string;
  locale: string;
  created_at: string;
};

const CONTEXT_LABEL: Record<ReviewRow["context"], string> = {
  visa_application: "🛂 Visa wizard",
  flight_request: "✈️ Flight request",
  tour_request: "🌴 Tour request",
  invite_request: "💌 Invitation",
};

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} of 5`} className="text-amber-500">
      {"★".repeat(n)}
      <span className="text-slate-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

// Ratings collected at the end of each flow. Everything is computed from the
// rows on request — at a few thousand reviews this is instant, and there is
// nothing to keep in sync.
export default async function ReviewsAdminPage() {
  // Defense in depth: the layout and proxy also guard /admin.
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_id, context, rating, comment, locale, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as ReviewRow[];

  // Reviewer emails, for the rows that have an author.
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const emails = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
    for (const p of profiles ?? []) emails.set(p.id, p.email);
  }

  const overall = rows.length
    ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: rows.filter((r) => r.rating === star).length,
  }));
  const byContext = (Object.keys(CONTEXT_LABEL) as ReviewRow["context"][]).map((ctx) => {
    const subset = rows.filter((r) => r.context === ctx);
    return {
      ctx,
      count: subset.length,
      avg: subset.length ? subset.reduce((s, r) => s + r.rating, 0) / subset.length : 0,
    };
  });
  const withComments = rows.filter((r) => r.comment.trim() !== "");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Reviews</h1>
      <p className="mt-2 text-slate-600">
        Ratings collected at the end of each flow. Low ratings with comments are the repair queue.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Could not load reviews. Check whether migration 0018 has been applied.
        </p>
      )}

      {/* Headline numbers */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Overall</p>
          <p className="mt-2 text-4xl font-extrabold">
            {rows.length ? overall.toFixed(2) : "—"}
            <span className="ml-2 text-base font-semibold text-slate-400">/ 5 · {rows.length} ratings</span>
          </p>
          <div className="mt-4 space-y-1.5">
            {distribution.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-bold text-slate-500">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${star >= 4 ? "bg-emerald-500" : star === 3 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: rows.length ? `${(count / rows.length) * 100}%` : 0 }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {byContext.map(({ ctx, count, avg }) => (
          <div key={ctx} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{CONTEXT_LABEL[ctx]}</p>
            <p className="mt-2 text-4xl font-extrabold">
              {count ? avg.toFixed(2) : "—"}
              <span className="ml-2 text-base font-semibold text-slate-400">/ 5 · {count}</span>
            </p>
            {count > 0 && <p className="mt-2"><Stars n={Math.round(avg)} /></p>}
          </div>
        ))}
      </div>

      {/* Comments */}
      <h2 className="mt-12 text-xl font-extrabold">Comments ({withComments.length})</h2>
      <div className="mt-4 space-y-4">
        {withComments.map((r) => (
          <article
            key={r.id}
            className={`rounded-3xl border bg-white p-5 shadow-sm ${r.rating <= 3 ? "border-amber-300" : "border-slate-200"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="flex items-center gap-3">
                <Stars n={r.rating} />
                <span className="font-semibold text-slate-700">{CONTEXT_LABEL[r.context]}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-500">{r.locale}</span>
              </p>
              <p className="text-slate-500">
                {r.user_id ? emails.get(r.user_id) ?? "client" : "anonymous"} · {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-800">{r.comment}</p>
          </article>
        ))}
        {!error && withComments.length === 0 && (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-500">
            No written comments yet — star counts still appear above.
          </p>
        )}
      </div>
    </main>
  );
}
