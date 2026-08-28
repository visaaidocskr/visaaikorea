"use client";

import type { ApplyFormData, BackgroundAnswers } from "@/lib/visa/types";
import { BooleanChoice } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// The six page-2 declarations from the official form. These are legal
// declarations — the applicant answers each explicitly; nothing is pre-selected
// and nothing is ever answered automatically.
const QUESTIONS: { key: keyof BackgroundAnswers; labelKey: string }[] = [
  { key: "crime", labelKey: "jbg.crime" },
  { key: "imprisonment", labelKey: "jbg.imprisonment" },
  { key: "drugs", labelKey: "jbg.drugs" },
  { key: "deported", labelKey: "jbg.deported" },
  { key: "prostitution", labelKey: "jbg.prostitution" },
  { key: "trafficking", labelKey: "jbg.trafficking" },
  { key: "visa_denied", labelKey: "jbg.visaDenied" },
];

// Step 9 — Background questions.
export function BackgroundStep({
  form,
  set,
}: {
  form: ApplyFormData;
  set: Setter;
}) {
  const { t } = useLocale();
  const answers = form.background_answers;
  const setAnswer = (key: keyof BackgroundAnswers, v: boolean) =>
    set("background_answers", { ...answers, [key]: v });

  const anyYes = QUESTIONS.some((q) => answers[q.key] === true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("japan.background.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("japan.background.intro")}
        </p>
      </div>

      <div className="space-y-5">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="border-b border-slate-100 pb-4 last:border-0">
            <BooleanChoice
              label={t(q.labelKey)}
              value={answers[q.key]}
              onChange={(v) => setAnswer(q.key, v)}
            />
          </div>
        ))}
      </div>

      {anyYes && (
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {t("japan.background.remarks")}
          <span className="text-red-500"> *</span>
        </label>
        <textarea
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          rows={4}
          placeholder={
            anyYes
              ? t("japan.background.yesDetails")
              : t("japan.background.optionalDetails")
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {form.remarks.trim() === "" && (
          <p className="mt-1 text-xs font-semibold text-red-500">
            {t("japan.background.requiredDetails")}
          </p>
        )}
      </div>
      )}
    </div>
  );
}
