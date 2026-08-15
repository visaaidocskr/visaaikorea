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

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Matches the fixed checkbox list on the official "Visa Application Form for
// Entry into Taiwan, R.O.C." (field 21) exactly — this is a closed list on the
// real form, not free text, so it's collected as an enum rather than reusing
// Japan's free-text travel_purpose.
export const TAIWAN_PURPOSE_OPTIONS: { value: TaiwanTravelPurpose; label: string }[] = [
  { value: "tourism", label: "Tourism" },
  { value: "business", label: "Business" },
  { value: "study", label: "Study" },
  { value: "employment", label: "Employment" },
  { value: "family", label: "Joining or visiting family" },
  { value: "religion", label: "Religion" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "other", label: "Other" },
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
  const homeAddressError =
    form.home_country_address.trim() !== "" && hasNonLatinScript(form.home_country_address)
      ? "Please enter your home-country address using Latin characters."
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Your Taiwan trip</h3>
          <p className="mt-1 text-sm text-slate-600">
            When and why you&rsquo;re travelling. Dates follow the Taiwan visa
            timing rules.
          </p>
        </div>
        <button
          type="button"
          onClick={openGuidance}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
          aria-label="Taiwan travel-date guidance"
        >
          ⓘ Guidance
        </button>
      </div>

      <div>
        <ChoiceGroup
          label="Purpose of travel"
          value={form.taiwan_travel_purpose}
          onChange={(v) => set("taiwan_travel_purpose", v as TaiwanTravelPurpose)}
          options={TAIWAN_PURPOSE_OPTIONS}
        />
        {form.taiwan_travel_purpose === "other" && (
          <div className="mt-3">
            <Input
              label="Please specify"
              value={form.taiwan_travel_purpose_other}
              onChange={(v) => set("taiwan_travel_purpose_other", v)}
            />
          </div>
        )}
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <DatePicker
            label={rule?.anchorLabel ?? "Planned submission date"}
            value={form.planned_submission_date}
            onChange={(v) => set("planned_submission_date", v)}
            required={Boolean(rule?.anchorRequired)}
            minISO={new Date().toISOString().slice(0, 10)}
            error={dateCheck.errors.anchor}
            onOpen={onDateFocus}
            blockedDate={taiwanSubmissionDateBlock}
          />
          <p className="text-xs text-slate-500">
            The mission only accepts applications in person on Monday,
            Wednesday, and Friday — other days can&rsquo;t be selected.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <DatePicker
            label="Propose date of arrival"
            value={form.travel_start_date}
            onChange={(v) => set("travel_start_date", v)}
            minISO={startWindow.minISO}
            maxISO={startWindow.maxISO}
            error={dateCheck.errors.travel_start}
            onOpen={onDateFocus}
          />
          <DatePicker
            label="Propose date of departure from Taiwan"
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
              Recommended: {recommendation.recommendedStartISO} to{" "}
              {recommendation.recommendedEndISO} ({recommendation.stayMin}–
              {recommendation.stayMax} days).
            </p>
            <button
              type="button"
              onClick={applyRecommendedDates}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
            >
              Use recommended dates
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
            Planned stay: {dateCheck.stayDays} day
            {dateCheck.stayDays === 1 ? "" : "s"}
            {rule ? ` (max ${rule.maxStayDays}).` : "."}
          </p>
        )}
      </section>

      <div>
        <h4 className="text-sm font-bold text-slate-800">Permanent address in home country</h4>
        <p className="mt-1 text-xs text-slate-500">
          Your permanent residential address and phone number in your home
          country (field 15 on the Taiwan form) — not your address in Korea.
        </p>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <Input
            label="Home-country address"
            value={form.home_country_address}
            onChange={(v) => set("home_country_address", v)}
            error={homeAddressError}
            helpText="Please enter the full address in English."
          />
          <Input
            label="Home-country phone number"
            value={form.home_country_phone}
            onChange={(v) => set("home_country_phone", v)}
            inputMode="tel"
            helpText="If you don't have a phone number registered in your home country, enter your own number or a family member's number there instead."
          />
        </div>
      </div>

      <Textarea
        label="Why did you choose Taiwan for your trip?"
        value={form.trip_reason}
        onChange={(v) => set("trip_reason", v)}
        maxWords={150}
        placeholder="In your own words — what made you want to visit Taiwan?"
        helpText="Optional, but a fuller answer helps us write a stronger Travel Purpose Statement."
      />
    </div>
  );
}
