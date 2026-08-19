"use client";

import type { ApplyFormData, TaiwanBackgroundAnswers } from "@/lib/visa/types";
import { BooleanChoice } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// The 8 page-2 (A–H) declarations from the official Taiwan form. Legal
// declarations — the applicant answers each explicitly; nothing is
// pre-selected and nothing is ever answered automatically.
const QUESTIONS: (keyof TaiwanBackgroundAnswers)[] = [
  "criminalRecord", "illegalEntry", "communicableDisease", "overstayedOrIllegalWork",
  "drugTrafficking", "visaRefused", "differentName", "workedInTaiwan",
];

// Background questions step for Taiwan applications.
export function TaiwanBackgroundStep({
  form,
  set,
}: {
  form: ApplyFormData;
  set: Setter;
}) {
  const { t } = useLocale();
  const answers = form.taiwan_background_answers;
  const setAnswer = (key: keyof TaiwanBackgroundAnswers, v: boolean) =>
    set("taiwan_background_answers", { ...answers, [key]: v });

  const anyYes = QUESTIONS.some((key) => answers[key] === true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("taiwan.backgroundTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("taiwan.backgroundDescription")}
        </p>
      </div>

      <div className="space-y-5">
        {QUESTIONS.map((key) => (
          <div key={key} className="border-b border-slate-100 pb-4 last:border-0">
            <BooleanChoice
              label={t(`taiwan.background.${key}`)}
              value={answers[key]}
              onChange={(v) => setAnswer(key, v)}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {t("taiwan.remarks")}
          {anyYes ? <span className="text-red-500"> *</span> : null}
        </label>
        <textarea
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          rows={4}
          placeholder={
            anyYes
              ? t("taiwan.remarksRequired")
              : t("taiwan.remarksOptional")
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {anyYes && form.remarks.trim() === "" && (
          <p className="mt-1 text-xs font-semibold text-red-500">
            {t("taiwan.remarksError")}
          </p>
        )}
      </div>
    </div>
  );
}
