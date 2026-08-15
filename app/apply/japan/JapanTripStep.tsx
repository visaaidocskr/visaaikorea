"use client";

import type { ApplyFormData } from "@/lib/visa/types";
import type {
  DestinationRule,
  DateValidation,
  Recommendation,
} from "@/lib/visa/destinations";
import { DatePicker } from "@/app/apply/DatePicker";
import { Select, Textarea } from "@/app/apply/fields";
import { submissionDateBlock, seoulTodayISO } from "@/lib/visa/japanEmbassy";

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
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Your Japan trip</h3>
          <p className="mt-1 text-sm text-slate-600">
            When and why you&rsquo;re travelling. Dates follow the Japan visa
            timing rules.
          </p>
        </div>
        <button
          type="button"
          onClick={openGuidance}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
          aria-label="Japan travel-date guidance"
        >
          ⓘ Guidance
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Purpose of visit"
          value={form.travel_purpose === "Tourism" ? "Tourism" : ""}
          onChange={(v) => set("travel_purpose", v)}
          options={PURPOSE_OPTIONS}
        />
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <DatePicker
            label="Planned submission date"
            value={form.planned_submission_date}
            onChange={(v) => set("planned_submission_date", v)}
            minISO={seoulTodayISO()}
            required={false}
            error={dateCheck.errors.anchor}
            blockedDate={submissionDateBlock}
          />
          <p className="text-xs text-slate-500">
            Select a business day when the Embassy of Japan in Korea is open.
            Weekends and embassy closure days cannot be selected. Closure dates
            follow the published annual schedule and may be updated.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <DatePicker
            label="Date of arrival (travel start)"
            value={form.travel_start_date}
            onChange={(v) => set("travel_start_date", v)}
            minISO={startWindow.minISO}
            maxISO={startWindow.maxISO}
            error={dateCheck.errors.travel_start}
            onOpen={onDateFocus}
          />
          <DatePicker
            label="Date of departure (travel end)"
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

      <Textarea
        label="Why did you choose Japan for your trip?"
        value={form.trip_reason}
        onChange={(v) => set("trip_reason", v)}
        maxWords={150}
        placeholder="In your own words — what made you want to visit Japan?"
        helpText="Optional, but a fuller answer helps us write a stronger Travel Purpose Statement."
      />
    </div>
  );
}
