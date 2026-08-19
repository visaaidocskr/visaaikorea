"use client";

import type { ApplyFormData, TaiwanTravelPurpose } from "@/lib/visa/types";
import type {
  DestinationRule,
  DateValidation,
  Recommendation,
} from "@/lib/visa/destinations";
import { DatePicker } from "@/app/apply/DatePicker";
import { Input, ChoiceGroup, Textarea } from "@/app/apply/fields";
import { hasNonLatinScript } from "@/lib/visa/forms";
import { taiwanSubmissionDateBlock } from "@/lib/visa/taiwanEmbassy";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Matches the fixed checkbox list on the official "Visa Application Form for
// Entry into Taiwan, R.O.C." (field 21) exactly — this is a closed list on the
// real form, not free text, so it's collected as an enum rather than reusing
// Japan's free-text travel_purpose.
export const TAIWAN_PURPOSE_OPTIONS: TaiwanTravelPurpose[] = [
  "tourism", "business", "study", "employment", "family", "religion", "entrepreneur", "other",
];

// Step — Taiwan trip. Mirrors JapanTripStep's date handling (reuses the
// wizard's computed rule/dateCheck/recommendation so behavior matches exactly)
// but asks Taiwan's fixed purpose-of-travel list instead of Japan's free-text
// purpose, and additionally collects the applicant's home-country address +
// phone — the printed form's field 15, which has no Japan equivalent (Japan's
// form only asks for the Korea address).
export function TaiwanTripStep({
  form,
  set,
  rule,
  dateCheck,
  startWindow,
  recommendation,
  onDateFocus,
  openGuidance,
  applyRecommendedDates,
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
}) {
  const { t } = useLocale();
  const homeAddressError =
    form.home_country_address.trim() !== "" && hasNonLatinScript(form.home_country_address)
      ? t("taiwan.homeAddressLatinError")
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{t("taiwan.tripTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {t("taiwan.tripDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={openGuidance}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
          aria-label={t("taiwan.guidanceAria")}
        >
          ⓘ {t("common.guidance")}
        </button>
      </div>

      <div>
        <ChoiceGroup
          label={t("taiwan.purpose")}
          value={form.taiwan_travel_purpose}
          onChange={(v) => set("taiwan_travel_purpose", v as TaiwanTravelPurpose)}
          options={TAIWAN_PURPOSE_OPTIONS.map((value) => ({ value, label: t(`taiwan.purpose.${value}`) }))}
        />
        {form.taiwan_travel_purpose === "other" && (
          <div className="mt-3">
            <Input
              label={t("common.pleaseSpecify")}
              value={form.taiwan_travel_purpose_other}
              onChange={(v) => set("taiwan_travel_purpose_other", v)}
            />
          </div>
        )}
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <DatePicker
            label={rule?.anchorLabel ?? t("taiwan.submissionDate")}
            value={form.planned_submission_date}
            onChange={(v) => set("planned_submission_date", v)}
            required={Boolean(rule?.anchorRequired)}
            minISO={new Date().toISOString().slice(0, 10)}
            error={dateCheck.errors.anchor}
            onOpen={onDateFocus}
            blockedDate={taiwanSubmissionDateBlock}
          />
          <p className="text-xs text-slate-500">
            {t("taiwan.submissionDateHelp")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <DatePicker
            label={t("taiwan.arrivalDate")}
            value={form.travel_start_date}
            onChange={(v) => set("travel_start_date", v)}
            minISO={startWindow.minISO}
            maxISO={startWindow.maxISO}
            error={dateCheck.errors.travel_start}
            onOpen={onDateFocus}
          />
          <DatePicker
            label={t("taiwan.departureDate")}
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
              {t("common.recommended")}: {recommendation.recommendedStartISO} to{" "}
              {recommendation.recommendedEndISO} ({recommendation.stayMin}–
              {recommendation.stayMax} days).
            </p>
            <button
              type="button"
              onClick={applyRecommendedDates}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
            >
              {t("common.useRecommendedDates")}
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
            {t("taiwan.plannedStay")}: {dateCheck.stayDays} {t(dateCheck.stayDays === 1 ? "common.day" : "common.days")}
            {dateCheck.stayDays === 1 ? "" : "s"}
            {rule ? ` (${t("common.max")} ${rule.maxStayDays}).` : "."}
          </p>
        )}
      </section>

      <div>
        <h4 className="text-sm font-bold text-slate-800">{t("taiwan.homeAddressTitle")}</h4>
        <p className="mt-1 text-xs text-slate-500">
          {t("taiwan.homeAddressDescription")}
        </p>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <Input
            label={t("taiwan.homeAddress")}
            value={form.home_country_address}
            onChange={(v) => set("home_country_address", v)}
            error={homeAddressError}
            helpText={t("taiwan.homeAddressHelp")}
          />
          <Input
            label={t("taiwan.homePhone")}
            value={form.home_country_phone}
            onChange={(v) => set("home_country_phone", v)}
            inputMode="tel"
            helpText={t("taiwan.homePhoneHelp")}
          />
        </div>
      </div>

      <Textarea
        label={t("taiwan.tripReason")}
        value={form.trip_reason}
        onChange={(v) => set("trip_reason", v)}
        maxWords={150}
        placeholder={t("taiwan.tripReasonPlaceholder")}
        helpText={t("taiwan.tripReasonHelp")}
      />
    </div>
  );
}
