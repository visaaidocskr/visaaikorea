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
    complete: { text: "Complete", cls: "bg-emerald-100 text-emerald-700" },
    attention: { text: "Needs attention", cls: "bg-amber-100 text-amber-800" },
    incomplete: { text: "Incomplete", cls: "bg-red-100 text-red-700" },
  } as const;
  const s = map[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>{s.text}</span>
  );
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Review &amp; confirm</h3>
        <p className="mt-1 text-sm text-slate-600">
          Check every section. Use <span className="font-semibold">Edit</span> to
          make changes — your progress is kept.
        </p>
      </div>

      {incomplete.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
          {incomplete.length} section{incomplete.length === 1 ? "" : "s"} still need
          required information: {incomplete.map((s) => s.title).join(", ")}.
        </div>
      )}

      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.key} className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h4 className="font-bold text-slate-900">{s.title}</h4>
                <StatusBadge status={s.status} />
              </div>
              <button
                type="button"
                onClick={() => goToStep(s.step)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
              >
                Edit
              </button>
            </div>
            <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
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

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledge(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
