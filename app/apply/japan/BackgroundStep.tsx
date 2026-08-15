"use client";

import type { ApplyFormData, BackgroundAnswers } from "@/lib/visa/types";
import { BooleanChoice } from "@/app/apply/fields";

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
  const answers = form.background_answers;
  const setAnswer = (key: keyof BackgroundAnswers, v: boolean) =>
    set("background_answers", { ...answers, [key]: v });

  const anyYes = QUESTIONS.some((q) => answers[q.key] === true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Additional questions</h3>
        <p className="mt-1 text-sm text-slate-600">
          These are official declarations. Please answer each one honestly — they
          are only ever answered by you.
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
          Remarks / special circumstances
          {anyYes ? <span className="text-red-500"> *</span> : null}
        </label>
        <textarea
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          rows={4}
          placeholder={
            anyYes
              ? "You answered “Yes” above — please provide the relevant details."
              : "Optional — anything the consulate should know."
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
