"use client";

import type { ApplyFormData, TaiwanBackgroundAnswers } from "@/lib/visa/types";
import { BooleanChoice } from "@/app/apply/fields";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// The 8 page-2 (A–H) declarations from the official Taiwan form. Legal
// declarations — the applicant answers each explicitly; nothing is
// pre-selected and nothing is ever answered automatically.
const QUESTIONS: { key: keyof TaiwanBackgroundAnswers; text: string }[] = [
  {
    key: "criminalRecord",
    text: "Do you have a criminal record within or outside the territory of the R.O.C., or have you ever been denied entry, ordered to leave or deported by the R.O.C. government?",
  },
  { key: "illegalEntry", text: "Have you ever entered Taiwan illegally?" },
  {
    key: "communicableDisease",
    text: "Have you ever had a communicable disease of public health significance, a dangerous physical or mental disorder, or been a drug abuser or addict?",
  },
  { key: "overstayedOrIllegalWork", text: "Have you ever overstayed or worked illegally in Taiwan, R.O.C.?" },
  { key: "drugTrafficking", text: "Have you ever been a controlled substance (drug) trafficker?" },
  { key: "visaRefused", text: "Have you ever been refused a visa by an R.O.C. mission abroad?" },
  { key: "differentName", text: "Have you ever applied for an R.O.C. visa using a different name?" },
  { key: "workedInTaiwan", text: "Have you ever worked in Taiwan?" },
];

// Background questions step for Taiwan applications.
export function TaiwanBackgroundStep({
  form,
  set,
}: {
  form: ApplyFormData;
  set: Setter;
}) {
  const answers = form.taiwan_background_answers;
  const setAnswer = (key: keyof TaiwanBackgroundAnswers, v: boolean) =>
    set("taiwan_background_answers", { ...answers, [key]: v });

  const anyYes = QUESTIONS.some((q) => answers[q.key] === true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Additional questions</h3>
        <p className="mt-1 text-sm text-slate-600">
          These are official declarations required by the Taiwan visa
          application form. Please answer each one honestly — a &ldquo;Yes&rdquo;
          answer does not automatically disqualify you, but must be explained.
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
          Remarks / explanation for any &ldquo;Yes&rdquo; answer
          {anyYes ? <span className="text-red-500"> *</span> : null}
        </label>
        <textarea
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          rows={4}
          placeholder={
            anyYes
              ? "You answered “Yes” above — please provide the relevant details."
              : "Optional — anything the mission should know."
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {anyYes && form.remarks.trim() === "" && (
          <p className="mt-1 text-xs font-semibold text-red-500">
            Please provide details for any “Yes” answer above.
          </p>
        )}
      </div>
    </div>
  );
}
