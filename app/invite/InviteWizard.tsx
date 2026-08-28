"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, ChoiceGroup, Textarea, SEX_OPTIONS, countWords } from "@/app/apply/fields";
import { DatePicker } from "@/app/apply/DatePicker";
import { KOREAN_VISA_STATUSES } from "@/lib/visa/config";
import { requirementsForStatus } from "@/lib/invite/requirements";
import {
  submissionDateBlock,
  earliestVisitStart,
  guaranteeEnd,
  isWorkingDay,
  TYPICAL_DECISION_DAYS,
} from "@/lib/invite/schedule";
import { EMPTY_INVITEE, type InviteFormData, type InviteeInput } from "@/lib/invite/types";
import { saveInvitation, submitInvitation } from "@/app/invite/actions";
import { useLocale } from "@/app/components/LocaleProvider";
import { RatingPrompt } from "@/app/components/reviews/RatingPrompt";
import { ComingSoonModal } from "@/app/components/ComingSoonModal";
import { INVITE_SUBMISSIONS_OPEN } from "@/lib/launch";

const STEPS = ["About you", "Who you're inviting", "The visit", "Documents", "Review"] as const;
type Step = (typeof STEPS)[number];

const STEP_KEYS: Record<Step, string> = {
  "About you": "invite.wizard.step.about",
  "Who you're inviting": "invite.wizard.step.people",
  "The visit": "invite.wizard.step.visit",
  Documents: "invite.wizard.step.documents",
  Review: "invite.wizard.step.review",
};

const REASON_MAX_WORDS = 250;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function InviteWizard({
  invitationId,
  isAdmin = false,
  initialForm,
}: {
  invitationId: string;
  isAdmin?: boolean;
  initialForm: InviteFormData;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [form, setForm] = useState<InviteFormData>(initialForm);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
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

  const earliestStart = earliestVisitStart(form.submission_date);

  const datesValid =
    form.submission_date !== "" &&
    isWorkingDay(form.submission_date) &&
    form.invitation_start_date !== "" &&
    form.invitation_end_date !== "" &&
    form.invitation_end_date >= form.invitation_start_date &&
    (!earliestStart || form.invitation_start_date >= earliestStart);

  const overLimit = (t: string) => countWords(t) > REASON_MAX_WORDS;
  const lettersValid =
    form.reason_invitation.trim() !== "" &&
    form.reason_statement.trim() !== "" &&
    form.reason_guarantee.trim() !== "" &&
    !overLimit(form.reason_invitation) &&
    !overLimit(form.reason_statement) &&
    !overLimit(form.reason_guarantee);

  const visitValid = datesValid && lettersValid;

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
    // Payments are still under bank review — see lib/launch.ts.
    if (!INVITE_SUBMISSIONS_OPEN && !isAdmin) {
      persist();
      setComingSoon(true);
      return;
    }
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

  const comingSoonModal = (
    <ComingSoonModal open={comingSoon} onClose={() => setComingSoon(false)} />
  );

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <h2 className="text-2xl font-bold text-emerald-900">{t("invite.wizard.received")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-emerald-800">
          {t("invite.wizard.receivedDescription").replace("{count}", String(form.invitees.length))}
        </p>
        <RatingPrompt
          context="invite_request"
          subjectId={invitationId}
          className="mx-auto mt-6 max-w-md text-left"
        />
        <a
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          {t("invite.wizard.dashboard")}
        </a>
      </div>
    );
  }

  return (
    <>
    {comingSoonModal}
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
            {i + 1}. {t(STEP_KEYS[s])}
          </li>
        ))}
      </ol>

      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        {current === "About you" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">{t("invite.wizard.aboutTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("invite.wizard.aboutDescription")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label={t("invite.wizard.fullName")}
                value={form.inviter_full_name}
                onChange={(v) => set("inviter_full_name", v.toUpperCase())}
                placeholder="ARTIKOV IBROKHIM DAMIN UGLI"
              />
              <Input
                label={t("invite.wizard.nationality")}
                value={form.inviter_nationality}
                onChange={(v) => set("inviter_nationality", v)}
              />
              <DatePicker
                label={t("invite.wizard.dob")}
                value={form.inviter_date_of_birth}
                onChange={(v) => set("inviter_date_of_birth", v)}
                maxISO={todayISO()}
                showYearMonth
              />
              <Input
                label={t("invite.wizard.passport")}
                value={form.inviter_passport_number}
                onChange={(v) => set("inviter_passport_number", v.toUpperCase())}
                required={false}
                helpText={t("invite.wizard.passportHelp")}
              />
              <Input
                label={t("invite.wizard.phoneKorea")}
                value={form.inviter_phone}
                onChange={(v) => set("inviter_phone", v)}
                inputMode="tel"
                placeholder="82 10 1234 5678"
              />
              <Select
                label={t("invite.wizard.koreanVisa")}
                value={form.korean_visa_status}
                onChange={(v) => set("korean_visa_status", v)}
                options={[...KOREAN_VISA_STATUSES]}
              />
            </div>

            <ChoiceGroup
              label={t("invite.wizard.sex")}
              value={form.inviter_sex}
              onChange={(v) => set("inviter_sex", v)}
              options={SEX_OPTIONS}
            />

            <Input
              label={t("invite.wizard.koreaAddress")}
              value={form.inviter_address_korea}
              onChange={(v) => set("inviter_address_korea", v)}
              placeholder="충청북도 청주시 서원구 …"
              helpText={t("invite.wizard.koreaAddressHelp")}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label={t("invite.wizard.organization")}
                value={form.inviter_org_name}
                onChange={(v) => set("inviter_org_name", v)}
                placeholder="서원대학교"
              />
              <Input
                label={t("invite.wizard.position")}
                value={form.inviter_position}
                onChange={(v) => set("inviter_position", v)}
                required={false}
                placeholder="학생"
              />
            </div>
            <Input
              label={t("invite.wizard.organizationAddress")}
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
              <h2 className="text-xl font-bold">{t("invite.wizard.peopleTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("invite.wizard.peopleDescription")}
              </p>
            </div>

            {form.invitees.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {t("invite.wizard.noOne")}
              </p>
            )}

            {form.invitees.map((p, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">{t("invite.wizard.person")} {i + 1}</h3>
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
                    {t("invite.wizard.remove")}
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label={t("invite.wizard.surname")}
                    value={p.surname}
                    onChange={(v) => setInvitee(i, "surname", v.toUpperCase())}
                  />
                  <Input
                    label={t("invite.wizard.givenName")}
                    value={p.given_name}
                    onChange={(v) => setInvitee(i, "given_name", v.toUpperCase())}
                  />
                  <Input
                    label={t("invite.wizard.middleName")}
                    value={p.middle_name}
                    onChange={(v) => setInvitee(i, "middle_name", v.toUpperCase())}
                    required={false}
                  />
                  <Input
                    label={t("invite.wizard.passport")}
                    value={p.passport_number}
                    onChange={(v) => setInvitee(i, "passport_number", v.toUpperCase())}
                  />
                  <DatePicker
                    label={t("invite.wizard.dob")}
                    value={p.date_of_birth}
                    onChange={(v) => setInvitee(i, "date_of_birth", v)}
                    maxISO={todayISO()}
                    showYearMonth
                  />
                  <Input
                    label={t("invite.wizard.nationality")}
                    value={p.nationality}
                    onChange={(v) => setInvitee(i, "nationality", v)}
                  />
                  <Input
                    label={t("invite.wizard.relationship")}
                    value={p.relationship}
                    onChange={(v) => setInvitee(i, "relationship", v)}
                    placeholder={t("invite.wizard.relationshipExample")}
                    helpText={t("invite.wizard.relationshipHelp")}
                  />
                  <Input
                    label={t("invite.wizard.homePhone")}
                    value={p.phone_home}
                    onChange={(v) => setInvitee(i, "phone_home", v)}
                    inputMode="tel"
                    required={false}
                    placeholder="+998 93 123 4567"
                  />
                </div>

                <div className="mt-6">
                  <ChoiceGroup
                    label={t("invite.wizard.sex")}
                    value={p.sex}
                    onChange={(v) => setInvitee(i, "sex", v)}
                    options={SEX_OPTIONS}
                  />
                </div>

                <div className="mt-6">
                  <Input
                    label={t("invite.wizard.homeAddress")}
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
              + {t("invite.wizard.addPerson")}
            </button>
          </div>
        )}

        {current === "The visit" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold">{t("invite.wizard.visitTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("invite.wizard.visitDescription")}
              </p>
            </div>

            <div className="space-y-4">
              <DatePicker
                label={t("invite.wizard.submissionDate")}
                value={form.submission_date}
                onChange={(v) => set("submission_date", v)}
                minISO={todayISO()}
                blockedDate={submissionDateBlock}
              />
              <p className="text-xs text-slate-500">
                {t("invite.wizard.weekends")}
              </p>
            </div>

            {form.submission_date && earliestStart && (
              <p className="rounded-2xl bg-blue-50 px-5 py-4 text-sm text-blue-800">
                {t("invite.wizard.timeline").replace("{days}", String(TYPICAL_DECISION_DAYS))} <strong>{earliestStart}</strong>.
              </p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <DatePicker
                label={t("invite.wizard.visitStarts")}
                value={form.invitation_start_date}
                onChange={(v) => set("invitation_start_date", v)}
                minISO={earliestStart ?? todayISO()}
                disabled={!form.submission_date}
              />
              <DatePicker
                label={t("invite.wizard.visitEnds")}
                value={form.invitation_end_date}
                onChange={(v) => set("invitation_end_date", v)}
                minISO={form.invitation_start_date || earliestStart || todayISO()}
                disabled={!form.invitation_start_date}
                error={
                  form.invitation_end_date &&
                  form.invitation_start_date &&
                  form.invitation_end_date < form.invitation_start_date
                    ? t("invite.wizard.endBeforeStart")
                    : undefined
                }
              />
            </div>

            {!form.submission_date && (
              <p className="text-sm text-slate-500">
                {t("invite.wizard.chooseSubmission")}
              </p>
            )}

            {form.invitation_start_date && (
              <p className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
                {t("invite.wizard.guaranteeRuns").replace("{months}", String(form.guarantee_months))}{" "}
                <strong>
                  {guaranteeEnd(form.invitation_start_date, form.guarantee_months)}
                </strong>
                . {t("invite.wizard.guaranteeNote")}
              </p>
            )}

            <div className="space-y-6 border-t border-slate-100 pt-8">
              <div>
                <h3 className="text-lg font-bold">{t("invite.wizard.answersTitle")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {t("invite.wizard.answersDescription")}
                </p>
              </div>

              <Textarea
                label={t("invite.wizard.answerInvitation")}
                value={form.reason_invitation}
                onChange={(v) => set("reason_invitation", v)}
                maxWords={REASON_MAX_WORDS}
                rows={5}
                required
                placeholder={t("invite.wizard.answerInvitationPlaceholder")}
                helpText={t("invite.wizard.answerInvitationHelp")}
              />

              <Textarea
                label={t("invite.wizard.answerHome")}
                value={form.reason_statement}
                onChange={(v) => set("reason_statement", v)}
                maxWords={REASON_MAX_WORDS}
                rows={8}
                required
                placeholder={t("invite.wizard.answerHomePlaceholder")}
                helpText={t("invite.wizard.answerHomeHelp")}
              />

              <Textarea
                label={t("invite.wizard.answerGuarantee")}
                value={form.reason_guarantee}
                onChange={(v) => set("reason_guarantee", v)}
                maxWords={REASON_MAX_WORDS}
                rows={5}
                required
                placeholder={t("invite.wizard.answerGuaranteePlaceholder")}
                helpText={t("invite.wizard.answerGuaranteeHelp")}
              />

              <p className="rounded-2xl bg-amber-50 px-5 py-4 text-xs leading-relaxed text-amber-900">
                {t("invite.wizard.noFabrication")}
              </p>
            </div>
          </div>
        )}

        {current === "Documents" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">{t("invite.wizard.documentsTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("invite.wizard.forStatus")} {form.korean_visa_status || t("invite.wizard.yourStatus")}.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h3 className="text-sm font-bold text-blue-900">{t("invite.wizard.weWrite")}</h3>
              <ul className="mt-3 space-y-2">
                {requirements.generated.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm text-blue-900">
                    <span className="mt-0.5">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-blue-800">
                {t("invite.wizard.oneSet")} {" "}
                {form.invitees.length > 0
                  ? t("invite.wizard.totalDocuments").replace("{count}", String(form.invitees.length * 3))
                  : t("invite.wizard.documentsEach")}
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
                  <p className="text-xs text-slate-400">{t("invite.wizard.source")}: {requirements.source}</p>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="text-sm font-bold text-amber-900">
                  {t("invite.wizard.requirementsUnconfirmed")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  {t("invite.wizard.requirementsUnconfirmedBody")}
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
                  {t("invite.wizard.ackTitle")}
                </strong>
                {t("invite.wizard.ackBody")}
              </span>
            </label>
          </div>
        )}

        {current === "Review" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">{t("invite.wizard.reviewTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("invite.wizard.reviewDescription")}
              </p>
            </div>

            <ReviewBlock
              title={t("invite.wizard.inviter")}
              editLabel={t("invite.wizard.edit")}
              onEdit={() => setStep(0)}
              rows={[
                [t("invite.wizard.fullName"), form.inviter_full_name],
                [t("invite.wizard.nationality"), form.inviter_nationality],
                [t("invite.wizard.dob"), form.inviter_date_of_birth],
                [t("invite.wizard.phone"), form.inviter_phone],
                [t("invite.wizard.koreaAddress"), form.inviter_address_korea],
                [t("invite.wizard.visaStatus"), form.korean_visa_status],
                [t("invite.wizard.organization"), form.inviter_org_name],
                [t("invite.wizard.position"), form.inviter_position],
              ]}
            />

            {form.invitees.map((p, i) => (
              <ReviewBlock
                key={i}
                title={`${t("invite.wizard.person")} ${i + 1}`}
                editLabel={t("invite.wizard.edit")}
                onEdit={() => setStep(1)}
                rows={[
                  ["Name", `${p.surname} ${p.given_name} ${p.middle_name}`.trim()],
                  [t("invite.wizard.dob"), p.date_of_birth],
                  [t("invite.wizard.passport"), p.passport_number],
                  [t("invite.wizard.relationship"), p.relationship],
                  [t("invite.wizard.address"), p.address_home],
                ]}
              />
            ))}

            <ReviewBlock
              title={t("invite.wizard.visitTitle")}
              editLabel={t("invite.wizard.edit")}
              onEdit={() => setStep(2)}
              rows={[
                [t("invite.wizard.submissionDate"), form.submission_date],
                [t("invite.wizard.visit"), `${form.invitation_start_date} → ${form.invitation_end_date}`],
                [t("invite.wizard.guarantee"), `${form.guarantee_months} ${t("invite.wizard.months")}`],
                [t("invite.wizard.documentsGoTo"), form.destination_mission],
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
            {t("invite.wizard.back")}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!stepValid[current] || busy}
              className="rounded-xl btn-glow px-7 py-3 text-sm font-bold text-white transition disabled:opacity-40 disabled:shadow-none"
            >
              {busy ? t("invite.wizard.saving") : t("invite.wizard.continue")}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!stepValid.Review || busy}
              className="rounded-xl btn-glow px-7 py-3 text-sm font-bold text-white transition disabled:opacity-40 disabled:shadow-none"
            >
              {busy ? t("invite.wizard.submitting") : t("invite.wizard.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function ReviewBlock({
  title,
  rows,
  onEdit,
  editLabel,
}: {
  title: string;
  rows: [string, string][];
  onEdit: () => void;
  editLabel: string;
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
          {editLabel}
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
