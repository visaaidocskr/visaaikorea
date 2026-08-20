"use client";

import type { ApplyFormData } from "@/lib/visa/types";

export type SectionStatus = "complete" | "attention" | "incomplete";

export type ReviewSection = {
  key: string;
  title: string;
  step: string; // wizard step name to jump to
  status: SectionStatus;
  rows: [string, string][];
};

function StatusBadge({ status }: { status: SectionStatus }) {
  const map = {
    complete: { icon: "✓", text: "Complete", cls: "bg-emerald-100 text-emerald-700" },
    attention: { icon: "!", text: "Needs attention", cls: "bg-amber-100 text-amber-800" },
    incomplete: { icon: "✕", text: "Incomplete", cls: "bg-red-100 text-red-700" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>
      <span aria-hidden>{s.icon}</span>
      {s.text}
    </span>
  );
}

// Stable-ish icon per section; keys vary between flows, so match loosely.
function sectionIcon(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("personal")) return "👤";
  if (k.includes("passport")) return "🛂";
  if (k.includes("identity") || k.includes("arc")) return "🪪";
  if (k.includes("trip") || k.includes("travel") || k.includes("flight")) return "✈️";
  if (k.includes("accommodation") || k.includes("hotel")) return "🏨";
  if (k.includes("korea") || k.includes("status")) return "🏢";
  if (k.includes("background") || k.includes("question")) return "🛡️";
  if (k.includes("doc")) return "📄";
  if (k.includes("contact")) return "☎️";
  return "📋";
}

// Step 10 — Review & Confirm. Read-only summary grouped by section with per-
// section Edit. Optional/unbooked items show "Needs attention" (amber), not a
// scary error; genuinely missing required data shows "Incomplete" (red).
export function JapanReview({
  sections,
  goToStep,
  acknowledged,
  onAcknowledge,
}: {
  form: ApplyFormData;
  sections: ReviewSection[];
  goToStep: (step: string) => void;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
}) {
  const incomplete = sections.filter((s) => s.status === "incomplete");
  const completeCount = sections.filter((s) => s.status === "complete").length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            Review &amp; confirm
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Check every section. Use <span className="font-semibold">Edit</span> to
            make changes — your progress is kept.
          </p>
        </div>
        <div className="min-w-44">
          <p className="text-right text-xs font-bold uppercase tracking-widest text-slate-400">
            {completeCount}/{sections.length} complete
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${sections.length ? Math.round((completeCount / sections.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {incomplete.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
          <span aria-hidden>⚠️</span>
          <span>{incomplete.length} section{incomplete.length === 1 ? "" : "s"} still need
          required information: {incomplete.map((s) => s.title).join(", ")}.</span>
        </div>
      )}

      <div className="space-y-4">
        {sections.map((s) => (
          <div
            key={s.key}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                    s.status === "complete"
                      ? "bg-emerald-50"
                      : s.status === "attention"
                        ? "bg-amber-50"
                        : "bg-red-50"
                  }`}
                >
                  {sectionIcon(s.key)}
                </span>
                <h4 className="font-bold text-slate-900">{s.title}</h4>
                <StatusBadge status={s.status} />
              </div>
              <button
                type="button"
                onClick={() => goToStep(s.step)}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <span aria-hidden>✎</span>
                Edit
              </button>
            </div>
            <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {s.rows.map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
                  <dt className="text-sm text-slate-500">{k}</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {v || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-blue-200 bg-blue-50/60 p-5 transition-colors hover:bg-blue-50">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledge(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">
          I confirm that the information provided is accurate and complete to the
          best of my knowledge. (This is an application review confirmation, not a
          substitute for the official declaration questions.)
        </span>
      </label>
    </div>
  );
}
