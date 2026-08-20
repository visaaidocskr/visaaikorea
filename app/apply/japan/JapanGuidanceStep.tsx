"use client";

import type { ReviewSection } from "@/app/apply/japan/JapanReview";

const REQUIRED_DOCS = [
  { key: "passport", label: "Passport" },
  { key: "arc_front", label: "ARC — front" },
  { key: "arc_back", label: "ARC — back" },
];
const OPTIONAL_DOCS = [
  { key: "flight_reservation", label: "Flight reservation" },
  { key: "hotel_booking", label: "Hotel booking" },
];

// Japan Guidance = a concise, professional pre-submission summary. It does NOT
// make unverified embassy-rule claims (no eVisa route, processing time, fixed
// stay/entry rules). It reports completion, what still needs attention, upload
// status, generated-document status, and the next step.
export function JapanGuidanceStep({
  sections,
  uploads,
  consent,
  onConsentChange,
  countryLabel = "Japan",
}: {
  sections: ReviewSection[];
  uploads: Record<string, string>;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  // Same component drives Taiwan's guidance step too — only the country name
  // in the copy below changes.
  countryLabel?: string;
}) {
  const attention = sections.filter((s) => s.status !== "complete");
  const complete = sections.length - attention.length;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Application summary</h3>
        <p className="mt-1 text-sm text-slate-600">
          A quick check before you submit. Our team prepares your documents after
          submission.
        </p>
      </div>

      {/* Completion */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900">Application progress</h4>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              attention.length === 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {complete} of {sections.length} sections complete
          </span>
        </div>
        {attention.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-700">
            ✓ Everything looks complete. You&rsquo;re ready to submit.
          </p>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-700">Needs attention</p>
            <ul className="mt-2 space-y-1">
              {attention.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      s.status === "incomplete" ? "text-red-500" : "text-amber-500"
                    }
                  >
                    {s.status === "incomplete" ? "●" : "○"}
                  </span>
                  <span className="text-slate-700">{s.title}</span>
                  <span className="text-xs text-slate-400">
                    ({s.status === "incomplete" ? "required info missing" : "optional / not booked"})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Uploaded documents */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <h4 className="font-bold text-slate-900">Uploaded documents</h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {REQUIRED_DOCS.map((d) => (
            <li key={d.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {d.label} <span className="text-red-500">*</span>
              </span>
              <span
                className={
                  uploads[d.key] ? "font-semibold text-emerald-600" : "font-semibold text-red-500"
                }
              >
                {uploads[d.key] ? "Uploaded" : "Missing"}
              </span>
            </li>
          ))}
          {OPTIONAL_DOCS.map((d) => (
            <li key={d.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{d.label}</span>
              <span
                className={
                  uploads[d.key] ? "font-semibold text-emerald-600" : "text-slate-400"
                }
              >
                {uploads[d.key] ? "Uploaded" : "Not provided"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Generated documents */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <h4 className="font-bold text-slate-900">Prepared documents</h4>
        <p className="mt-2 text-sm text-slate-600">
          After you submit, our team reviews your application, prepares your{" "}
          {countryLabel} visa document package and submits it to the embassy for
          you — you don&rsquo;t need to print or deliver anything. Follow every
          status update, and the visa decision itself (usually within 7–10
          days), in <strong>My results</strong> on your dashboard.
        </p>
      </div>

      {/* Next step + consent */}
      <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5">
        <h4 className="font-bold text-slate-900">Next step</h4>
        <p className="mt-2 text-sm text-slate-600">
          Submit your application below. You can still edit it from your dashboard
          before our team begins preparing your documents.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Vitamin VisaAI prepares documents based on the information you provide.
          Visa approval is decided only by the embassy / consulate / immigration
          authority. This service does not guarantee visa approval.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-5 w-5"
          />
          I have reviewed my application and understand the above.
        </label>
      </div>
    </div>
  );
}
