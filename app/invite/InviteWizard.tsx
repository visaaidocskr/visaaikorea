"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, ChoiceGroup, Textarea, SEX_OPTIONS, countWords } from "@/app/apply/fields";
import { DatePicker } from "@/app/apply/DatePicker";
import { KOREAN_VISA_STATUSES } from "@/lib/visa/config";
import { requirementsForStatus } from "@/lib/invite/requirements";
import { EMPTY_INVITEE, type InviteFormData, type InviteeInput } from "@/lib/invite/types";
import { saveInvitation, submitInvitation } from "@/app/invite/actions";

const STEPS = ["About you", "Who you're inviting", "The visit", "Documents", "Review"] as const;
type Step = (typeof STEPS)[number];

const REASON_MAX_WORDS = 200;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// The guarantee has to cover the whole invitation window — a guarantee that
// ends before the visit does is the single most common reason these get
// bounced back, so it is computed and shown rather than left to the client.
function guaranteeEndISO(startISO: string, months: number): string | null {
  if (!startISO) return null;
  const d = new Date(startISO);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function InviteWizard({
  invitationId,
  initialForm,
}: {
  invitationId: string;
  initialForm: InviteFormData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<InviteFormData>(initialForm);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const current = STEPS[step];

  const set = useCallback(
    <K extends keyof InviteFormData>(key: K, value: InviteFormData[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    },
    []
  );

  const setInvitee = useCallback(
    <K extends keyof InviteeInput>(index: number, key: K, value: InviteeInput[K]) => {
      setForm((f) => ({
        ...f,
        invitees: f.invitees.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
      }));
    },
    []
  );

  const requirements = useMemo(
    () => requirementsForStatus(form.korean_visa_status),
    [form.korean_visa_status]
  );

  // --- validity -----------------------------------------------------------
  const inviterValid =
    form.inviter_full_name.trim() !== "" &&
    form.inviter_nationality.trim() !== "" &&
    form.inviter_sex !== "" &&
    form.inviter_date_of_birth !== "" &&
    form.inviter_phone.trim() !== "" &&
    form.inviter_address_korea.trim() !== "" &&
    form.korean_visa_status !== "" &&
    form.inviter_org_name.trim() !== "";

  const inviteeValid = (p: InviteeInput) =>
    p.surname.trim() !== "" &&
    p.given_name.trim() !== "" &&
    p.date_of_birth !== "" &&
    p.sex !== "" &&
    p.nationality.trim() !== "" &&
    p.passport_number.trim() !== "" &&
    p.address_home.trim() !== "" &&
    p.relationship.trim() !== "";

  const inviteesValid =
    form.invitees.length > 0 && form.invitees.every(inviteeValid);

  const datesValid =
    form.invitation_start_date !== "" &&
    form.invitation_end_date !== "" &&
    form.invitation_end_date >= form.invitation_start_date;

  const reasonOverLimit = countWords(form.invitation_reason) > REASON_MAX_WORDS;
  const visitValid = datesValid && !reasonOverLimit;

  const docsValid = form.requirements_ack;

  const stepValid: Record<Step, boolean> = {
    "About you": inviterValid,
    "Who you're inviting": inviteesValid,
    "The visit": visitValid,
    Documents: docsValid,
    Review: inviterValid && inviteesValid && visitValid && docsValid,
  };

  const persist = useCallback(async () => {
    const res = await saveInvitation(invitationId, form);
    if (!res.ok) setError(res.error);
    return res.ok;
  }, [invitationId, form]);

  async function next() {
    setError(null);
    setBusy(true);
    const ok = await persist();
    setBusy(false);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError(null);
    setBusy(true);
    const saved = await persist();
    if (!saved) {
      setBusy(false);
      return;
    }
    const res = await submitInvitation(invitationId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <h2 className="text-2xl font-bold text-emerald-900">Request received</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-emerald-800">
          We are preparing the 초청장, 초청 사유서 and 신원보증서 for{" "}
          {form.invitees.length === 1
            ? "the person"
            : `each of the ${form.invitees.length} people`}{" "}
          you are inviting. You will find them in your dashboard once our team
          has checked them.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          Go to dashboard
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <ol className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              i === step
                ? "bg-blue-700 text-white"
                : i < step
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        {current === "About you" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">About you</h2>
              <p className="mt-1 text-sm text-slate-600">
                You are the inviter. These details go onto every document, so
                they must match your passport and ARC exactly.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Full name (as in passport)"
                value={form.inviter_full_name}
                onChange={(v) => set("inviter_full_name", v.toUpperCase())}
                placeholder="ARTIKOV IBROKHIM DAMIN UGLI"
              />
              <Input
                label="Nationality"
                value={form.inviter_nationality}
                onChange={(v) => set("inviter_nationality", v)}
              />
              <DatePicker
                label="Date of birth"
                value={form.inviter_date_of_birth}
                onChange={(v) => set("inviter_date_of_birth", v)}
                maxISO={todayISO()}
                showYearMonth
              />
              <Input
                label="Passport number"
                value={form.inviter_passport_number}
                onChange={(v) => set("inviter_passport_number", v.toUpperCase())}
                required={false}
                helpText="Optional — the form accepts a passport number or a date of birth."
              />
              <Input
                label="Phone in Korea"
                value={form.inviter_phone}
                onChange={(v) => set("inviter_phone", v)}
                inputMode="tel"
                placeholder="82 10 1234 5678"
              />
              <Select
                label="Your Korean visa status"
                value={form.korean_visa_status}
                onChange={(v) => set("korean_visa_status", v)}
                options={[...KOREAN_VISA_STATUSES]}
              />
            </div>

            <ChoiceGroup
              label="Sex"
              value={form.inviter_sex}
              onChange={(v) => set("inviter_sex", v)}
              options={SEX_OPTIONS}
            />

            <Input
              label="Your address in Korea"
              value={form.inviter_address_korea}
              onChange={(v) => set("inviter_address_korea", v)}
              placeholder="충청북도 청주시 서원구 …"
              helpText="Write this in Korean — it is read by Korean officials."
            />

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="University or employer"
                value={form.inviter_org_name}
                onChange={(v) => set("inviter_org_name", v)}
                placeholder="서원대학교"
              />
              <Input
                label="Your position there"
                value={form.inviter_position}
                onChange={(v) => set("inviter_position", v)}
                required={false}
                placeholder="학생"
              />
            </div>
            <Input
              label="Address of your university or employer"
              value={form.inviter_org_address}
              onChange={(v) => set("inviter_org_address", v)}
              required={false}
              placeholder="충청북도 청주시 서원구 무심서로 377-3"
            />
          </div>
        )}

        {current === "Who you're inviting" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Who you&rsquo;re inviting</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add one entry per person. Each gets their own set of documents,
                so every person needs their own passport details.
              </p>
            </div>

            {form.invitees.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No one added yet.
              </p>
            )}

            {form.invitees.map((p, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Person {i + 1}</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        invitees: f.invitees.filter((_, j) => j !== i),
                      }))
                    }
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Surname (as in passport)"
                    value={p.surname}
                    onChange={(v) => setInvitee(i, "surname", v.toUpperCase())}
                  />
                  <Input
                    label="Given name"
                    value={p.given_name}
                    onChange={(v) => setInvitee(i, "given_name", v.toUpperCase())}
                  />
                  <Input
                    label="Middle name / patronymic"
                    value={p.middle_name}
                    onChange={(v) => setInvitee(i, "middle_name", v.toUpperCase())}
                    required={false}
                  />
                  <Input
                    label="Passport number"
                    value={p.passport_number}
                    onChange={(v) => setInvitee(i, "passport_number", v.toUpperCase())}
                  />
                  <DatePicker
                    label="Date of birth"
                    value={p.date_of_birth}
                    onChange={(v) => setInvitee(i, "date_of_birth", v)}
                    maxISO={todayISO()}
                    showYearMonth
                  />
                  <Input
                    label="Nationality"
                    value={p.nationality}
                    onChange={(v) => setInvitee(i, "nationality", v)}
                  />
                  <Input
                    label="Relationship to you"
                    value={p.relationship}
                    onChange={(v) => setInvitee(i, "relationship", v)}
                    placeholder="mother"
                    helpText="How they are related to you, e.g. mother, father, brother."
                  />
                  <Input
                    label="Phone in home country"
                    value={p.phone_home}
                    onChange={(v) => setInvitee(i, "phone_home", v)}
                    inputMode="tel"
                    required={false}
                    placeholder="+998 93 123 4567"
                  />
                </div>

                <div className="mt-6">
                  <ChoiceGroup
                    label="Sex"
                    value={p.sex}
                    onChange={(v) => setInvitee(i, "sex", v)}
                    options={SEX_OPTIONS}
                  />
                </div>

                <div className="mt-6">
                  <Input
                    label="Address in home country"
                    value={p.address_home}
                    onChange={(v) => setInvitee(i, "address_home", v)}
                    placeholder="Samarkand, Jomboy, …"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, invitees: [...f.invitees, { ...EMPTY_INVITEE }] }))
              }
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700"
            >
              + Add a person
            </button>
          </div>
        )}

        {current === "The visit" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">The visit</h2>
              <p className="mt-1 text-sm text-slate-600">
                When they are coming, and why you are inviting them.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DatePicker
                label="Visit starts"
                value={form.invitation_start_date}
                onChange={(v) => set("invitation_start_date", v)}
                minISO={todayISO()}
              />
              <DatePicker
                label="Visit ends"
                value={form.invitation_end_date}
                onChange={(v) => set("invitation_end_date", v)}
                minISO={form.invitation_start_date || todayISO()}
                error={
                  form.invitation_end_date &&
                  form.invitation_start_date &&
                  form.invitation_end_date < form.invitation_start_date
                    ? "The end date cannot be before the start date."
                    : undefined
                }
              />
            </div>

            {form.invitation_start_date && (
              <p className="rounded-2xl bg-blue-50 px-5 py-4 text-sm text-blue-800">
                Your guarantee will run for {form.guarantee_months} months, to{" "}
                <strong>{guaranteeEndISO(form.invitation_start_date, form.guarantee_months)}</strong>
                . The guarantee period has to cover the whole visit — this is
                one of the most common reasons documents get sent back.
              </p>
            )}

            <Textarea
              label="Why are you inviting them?"
              value={form.invitation_reason}
              onChange={(v) => set("invitation_reason", v)}
              maxWords={REASON_MAX_WORDS}
              rows={7}
              placeholder="In your own words: who they are, why you want them to visit, what they will do here, and what they are returning home to."
              helpText="This becomes your 초청 사유서. The more concrete you are — their job, family and commitments at home — the stronger it reads."
            />
          </div>
        )}

        {current === "Documents" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">What you need to gather</h2>
              <p className="mt-1 text-sm text-slate-600">
                For {form.korean_visa_status || "your residence status"}.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h3 className="text-sm font-bold text-blue-900">We write these for you</h3>
              <ul className="mt-3 space-y-2">
                {requirements.generated.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm text-blue-900">
                    <span className="mt-0.5">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-blue-800">
                One set per person you invite —{" "}
                {form.invitees.length > 0
                  ? `${form.invitees.length * 3} documents in total.`
                  : "three documents each."}
              </p>
            </div>

            {requirements.verified ? (
              <>
                {requirements.groups.map((g) => (
                  <div key={g.title} className="rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-800">{g.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {g.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                          <span className="mt-0.5 text-slate-400">□</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {requirements.source && (
                  <p className="text-xs text-slate-400">Source: {requirements.source}</p>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="text-sm font-bold text-amber-900">
                  We haven&rsquo;t confirmed the list for this status yet
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  Korea does not publish one list covering every residence
                  status, and it differs between missions. Rather than show you
                  a guess, our team will confirm your exact list and send it to
                  you after you submit.
                </p>
              </div>
            )}

            {requirements.notes.map((n) => (
              <p key={n} className="rounded-2xl bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600">
                {n}
              </p>
            ))}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-5 transition hover:border-blue-400">
              <input
                type="checkbox"
                checked={form.requirements_ack}
                onChange={(e) => set("requirements_ack", e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-blue-700"
              />
              <span className="text-sm text-slate-700">
                <strong className="block text-slate-900">
                  I have read and understood this list.
                </strong>
                I understand these documents are mine to gather, that the visa
                is decided by the Korean embassy, and that VisaAI Korea prepares
                the invitation paperwork but does not submit the application or
                guarantee its approval.
              </span>
            </label>
          </div>
        )}

        {current === "Review" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Check everything</h2>
              <p className="mt-1 text-sm text-slate-600">
                These exact values are printed onto the documents.
              </p>
            </div>

            <ReviewBlock
              title="You (the inviter)"
              onEdit={() => setStep(0)}
              rows={[
                ["Full name", form.inviter_full_name],
                ["Nationality", form.inviter_nationality],
                ["Date of birth", form.inviter_date_of_birth],
                ["Phone", form.inviter_phone],
                ["Address in Korea", form.inviter_address_korea],
                ["Visa status", form.korean_visa_status],
                ["Organisation", form.inviter_org_name],
                ["Position", form.inviter_position],
              ]}
            />

            {form.invitees.map((p, i) => (
              <ReviewBlock
                key={i}
                title={`Person ${i + 1}`}
                onEdit={() => setStep(1)}
                rows={[
                  ["Name", `${p.surname} ${p.given_name} ${p.middle_name}`.trim()],
                  ["Date of birth", p.date_of_birth],
                  ["Passport", p.passport_number],
                  ["Relationship", p.relationship],
                  ["Address", p.address_home],
                ]}
              />
            ))}

            <ReviewBlock
              title="The visit"
              onEdit={() => setStep(2)}
              rows={[
                ["Dates", `${form.invitation_start_date} → ${form.invitation_end_date}`],
                ["Guarantee", `${form.guarantee_months} months`],
                ["Documents go to", form.destination_mission],
              ]}
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || busy}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!stepValid[current] || busy}
              className="rounded-xl bg-blue-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-300"
            >
              {busy ? "Saving…" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!stepValid.Review || busy}
              className="rounded-xl bg-blue-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-300"
            >
              {busy ? "Submitting…" : "Submit request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: [string, string][];
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          Edit
        </button>
      </div>
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-1">
            <dt className="text-sm text-slate-500">{k}</dt>
            <dd className="text-right text-sm font-semibold text-slate-900">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
