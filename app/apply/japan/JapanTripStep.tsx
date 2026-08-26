"use client";

import type { ApplyFormData } from "@/lib/visa/types";
import type {
  DestinationRule,
  DateValidation,
  Recommendation,
} from "@/lib/visa/destinations";
import { DatePicker } from "@/app/apply/DatePicker";
import { useLocale } from "@/app/components/LocaleProvider";
import { Select, Textarea } from "@/app/apply/fields";
import { submissionDateBlock, seoulTodayISO, type EmbassyClosure } from "@/lib/visa/japanEmbassy";

// Only tourist visas are supported today; keep this list so more can be added later.
const PURPOSE_OPTIONS = ["Tourism"];

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Step 4 — Japan trip. Reuses the wizard's computed date rule / validation /
// recommendation so date behavior matches the rest of the app exactly.
export function JapanTripStep({
  form,
  set,
  rule,
  dateCheck,
  startWindow,
  recommendation,
  onDateFocus,
  openGuidance,
  applyRecommendedDates,
  embassyClosures,
}: {
  form: ApplyFormData;
  set: Setter;
  rule: DestinationRule | null;
  dateCheck: DateValidation;
  startWindow: { minISO: string | null; maxISO: string | null };
  recommendation: Recommendation | null;
  onDateFocus: () => void;
  openGuidance: () => void;
  applyRecommendedDates: () => void;
  embassyClosures: EmbassyClosure[];
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{t("jtrip.title")}</h3>
          <p className="mt-1 text-sm text-slate-600">
{t("jtrip.intro")}
          </p>
        </div>
        <button
          type="button"
          onClick={openGuidance}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
          aria-label="Japan travel-date guidance"
        >
          ⓘ {t("jtrip.guidance")}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label={t("jtrip.purpose")}
          value={form.travel_purpose === "Tourism" ? "Tourism" : ""}
          onChange={(v) => set("travel_purpose", v)}
          options={PURPOSE_OPTIONS.map((value) => ({ value, label: t("jtrip.purposeTourism") }))}
        />
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <DatePicker
            label={t("jtrip.submission")}
            value={form.planned_submission_date}
            onChange={(v) => set("planned_submission_date", v)}
            minISO={seoulTodayISO()}
            required={false}
            error={dateCheck.errors.anchor}
            blockedDate={(iso) => submissionDateBlock(iso, embassyClosures)}
          />
          <p className="text-xs text-slate-500">
{t("jtrip.submissionHelp")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <DatePicker
            label={t("jtrip.arrival")}
            value={form.travel_start_date}
            onChange={(v) => set("travel_start_date", v)}
            minISO={startWindow.minISO}
            maxISO={startWindow.maxISO}
            error={dateCheck.errors.travel_start}
            onOpen={onDateFocus}
          />
          <DatePicker
            label={t("jtrip.departure")}
            value={form.travel_end_date}
            onChange={(v) => set("travel_end_date", v)}
            minISO={form.travel_start_date || null}
            error={dateCheck.errors.travel_end}
            onOpen={onDateFocus}
          />
        </div>

        {recommendation?.recommendedStartISO && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3">
            <p className="text-sm text-blue-800">
              {t("jtrip.recommended")
                .replace("{from}", recommendation.recommendedStartISO)
                .replace("{to}", recommendation.recommendedEndISO ?? "")
                .replace("{min}", String(recommendation.stayMin))
                .replace("{max}", String(recommendation.stayMax))}
            </p>
            <button
              type="button"
              onClick={applyRecommendedDates}
              className="rounded-xl btn-glow px-4 py-2 text-sm font-bold text-white"
            >
              {t("jtrip.useRecommended")}
            </button>
          </div>
        )}

        {dateCheck.errors.stay && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"
          >
            {dateCheck.errors.stay}
          </p>
        )}
        {dateCheck.stayDays != null && !dateCheck.errors.stay && (
          <p className="text-sm font-semibold text-slate-600">
            {t("jtrip.stay")
              .replace("{days}", String(dateCheck.stayDays))
              .replace("{dayWord}", dateCheck.stayDays === 1 ? t("jtrip.day") : t("jtrip.days"))}
            {rule ? t("jtrip.stayMax").replace("{max}", String(rule.maxStayDays)) : "."}
          </p>
        )}
      </section>

      <Textarea
        label={t("jtrip.why")}
        value={form.trip_reason}
        onChange={(v) => set("trip_reason", v)}
        maxWords={150}
        placeholder={t("jtrip.whyPh")}
        helpText={t("jtrip.whyHelp")}
      />
    </div>
  );
}
