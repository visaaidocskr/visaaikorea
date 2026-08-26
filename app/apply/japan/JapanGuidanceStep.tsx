"use client";

import type { ReviewSection } from "@/app/apply/japan/JapanReview";
import { useLocale } from "@/app/components/LocaleProvider";

const REQUIRED_DOCS = [
  { key: "passport", labelKey: "jsum.docPassport" },
  { key: "arc_front", labelKey: "jsum.docArcFront" },
  { key: "arc_back", labelKey: "jsum.docArcBack" },
];
const OPTIONAL_DOCS = [
  { key: "flight_reservation", labelKey: "jsum.docFlight" },
  { key: "hotel_booking", labelKey: "jsum.docHotel" },
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
  const { t } = useLocale();
  const attention = sections.filter((s) => s.status !== "complete");
  const complete = sections.length - attention.length;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("jsum.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
{t("jsum.intro")}
        </p>
      </div>

      {/* Completion */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900">{t("jsum.progress")}</h4>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              attention.length === 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {t("jsum.sectionsComplete").replace("{done}", String(complete)).replace("{total}", String(sections.length))}
          </span>
        </div>
        {attention.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-700">
{t("jsum.allComplete")}
          </p>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-700">{t("jsum.needsAttention")}</p>
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
                    ({s.status === "incomplete" ? t("jsum.missingInfo") : t("jsum.optionalNote")})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Uploaded documents */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <h4 className="font-bold text-slate-900">{t("jsum.uploaded")}</h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {REQUIRED_DOCS.map((d) => (
            <li key={d.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {t(d.labelKey)} <span className="text-red-500">*</span>
              </span>
              <span
                className={
                  uploads[d.key] ? "font-semibold text-emerald-600" : "font-semibold text-red-500"
                }
              >
                {uploads[d.key] ? t("jsum.stUploaded") : t("jsum.stMissing")}
              </span>
            </li>
          ))}
          {OPTIONAL_DOCS.map((d) => (
            <li key={d.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{t(d.labelKey)}</span>
              <span
                className={
                  uploads[d.key] ? "font-semibold text-emerald-600" : "text-slate-400"
                }
              >
                {uploads[d.key] ? t("jsum.stUploaded") : t("jsum.stNotProvided")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Generated documents */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <h4 className="font-bold text-slate-900">{t("jsum.prepared")}</h4>
        <p className="mt-2 text-sm text-slate-600">
          {(countryLabel === "Taiwan"
            ? t("jsum.preparedSelf")
            : t("jsum.preparedAgent")
          ).replace("{country}", countryLabel ?? "Japan")}
        </p>
      </div>

      {/* Next step + consent */}
      <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5">
        <h4 className="font-bold text-slate-900">{t("jsum.next")}</h4>
        <p className="mt-2 text-sm text-slate-600">
{t("jsum.nextBody")}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
{t("jsum.legal")}
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-5 w-5"
          />
{t("jsum.consent")}
        </label>
      </div>
    </div>
  );
}
