"use client";

import type { ApplyFormData, PreviousJapanVisit } from "@/lib/visa/types";
import { DatePicker } from "@/app/apply/DatePicker";
import { Input, BooleanChoice } from "@/app/apply/fields";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

const EMPTY_VISIT: PreviousJapanVisit = {
  visited_from: "",
  visited_to: "",
  duration_note: "",
};

// Step 7 — Previous travel to Japan. Structured records (not a fragile text
// field), stored in previous_japan_visits.
export function PreviousVisitsStep({
  form,
  set,
}: {
  form: ApplyFormData;
  set: Setter;
}) {
  const list = form.previous_japan_visits;
  const today = new Date().toISOString().slice(0, 10);

  const update = (i: number, patch: Partial<PreviousJapanVisit>) =>
    set(
      "previous_japan_visits",
      list.map((v, idx) => (idx === i ? { ...v, ...patch } : v))
    );
  const add = () => set("previous_japan_visits", [...list, { ...EMPTY_VISIT }]);
  const remove = (i: number) =>
    set("previous_japan_visits", list.filter((_, idx) => idx !== i));

  function onChange(v: boolean) {
    set("has_previous_japan_visits", v);
    if (v && list.length === 0) add();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Previous travel to Japan</h3>
        <p className="mt-1 text-sm text-slate-600">
          Prior visits can strengthen your application.
        </p>
      </div>

      <BooleanChoice
        label="Have you visited Japan before?"
        value={form.has_previous_japan_visits}
        onChange={onChange}
      />

      {form.has_previous_japan_visits === true && (
        <div className="space-y-5">
          {list.map((v, i) => {
            const orderError =
              v.visited_from && v.visited_to && v.visited_to < v.visited_from
                ? "The end date must be on or after the start date."
                : undefined;
            return (
              <div key={i} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">Visit {i + 1}</h4>
                  {list.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-6 md:grid-cols-3">
                  <DatePicker
                    label="From"
                    value={v.visited_from}
                    onChange={(val) => update(i, { visited_from: val })}
                    maxISO={today}
                    showYearMonth
                  />
                  <DatePicker
                    label="To"
                    value={v.visited_to}
                    onChange={(val) => update(i, { visited_to: val })}
                    minISO={v.visited_from || null}
                    maxISO={today}
                    error={orderError}
                    showYearMonth
                  />
                  <Input
                    label="Duration / notes"
                    value={v.duration_note}
                    onChange={(val) => update(i, { duration_note: val })}
                    required={false}
                    placeholder="e.g. 5 days, tourism"
                  />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={add}
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
          >
            + Add another previous visit
          </button>
        </div>
      )}
    </div>
  );
}
