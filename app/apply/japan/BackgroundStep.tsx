"use client";

import type { ApplyFormData, BackgroundAnswers } from "@/lib/visa/types";
import { BooleanChoice } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// The six page-2 declarations from the official form. These are legal
// declarations — the applicant answers each explicitly; nothing is pre-selected
// and nothing is ever answered automatically.
const QUESTIONS: { key: keyof BackgroundAnswers; text: string }[] = [
  { key: "crime", text: "Have you ever been convicted of a crime or offence in any country?" },
  {
    key: "imprisonment",
    text: "Have you ever been sentenced to imprisonment for 1 year or more in any country?",
  },
  {
    key: "drugs",
    text: "Have you ever been convicted and sentenced for a drug offence (narcotics, marijuana, opium, stimulants or psychotropic substances) in any country?",
  },
  {
    key: "deported",
    text: "Have you ever been deported or removed from Japan or any country for overstaying a visa or violating any law or regulation?",
  },
  {
    key: "prostitution",
    text: "Have you ever engaged in prostitution, or in the intermediation or solicitation of a prostitute for others, or provided a place for prostitution, or any activity directly connected to prostitution?",
  },
  {
    key: "trafficking",
    text: "Have you ever committed trafficking in persons, or incited or aided another to commit such an offence?",
  },
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
              label={q.text}
              value={answers[q.key]}
              onChange={(v) => setAnswer(q.key, v)}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {t("japan.background.remarks")}
          {anyYes ? <span className="text-red-500"> *</span> : null}
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
        {anyYes && form.remarks.trim() === "" && (
          <p className="mt-1 text-xs font-semibold text-red-500">
            {t("japan.background.requiredDetails")}
          </p>
        )}
      </div>
    </div>
  );
}
