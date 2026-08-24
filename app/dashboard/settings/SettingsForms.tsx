"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useLocale } from "@/app/components/LocaleProvider";
import {
  changePassword,
  requestDeletion,
  updateProfile,
  type SettingsState,
} from "./actions";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200";
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

function Submit({ label, danger = false }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        danger
          ? "rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          : "btn-glow rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      }
    >
      {pending ? t("auth.wait") : label}
    </button>
  );
}

// Success messages come back as short codes so the page can show them in the
// visitor's language; errors come back as text from the action.
function Feedback({ state, successKey }: { state: SettingsState; successKey: Record<string, string> }) {
  const { t } = useLocale();
  if (state.error) {
    return <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{state.error}</p>;
  }
  if (state.message && successKey[state.message]) {
    return <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">{t(successKey[state.message])}</p>;
  }
  return null;
}

function Card({ title, body, children, danger = false }: { title: string; body: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={`rounded-3xl border bg-white p-6 shadow-sm md:p-8 ${danger ? "border-red-200" : "border-slate-200"}`}>
      <h2 className={`text-xl font-bold ${danger ? "text-red-700" : "text-slate-900"}`}>{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action] = useActionState<SettingsState, FormData>(updateProfile, {});
  const { t } = useLocale();
  return (
    <Card title={t("settings.profile")} body={t("settings.profileBody")}>
      <form action={action} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="full_name">{t("settings.fullName")}</label>
            <input id="full_name" name="full_name" defaultValue={fullName} required maxLength={120} className={inputClass} autoComplete="name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">{t("settings.phone")}</label>
            <input id="phone" name="phone" defaultValue={phone} maxLength={40} className={inputClass} autoComplete="tel" inputMode="tel" placeholder="010-0000-0000" />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">{t("settings.email")}</label>
          <input id="email" value={email} readOnly className={`${inputClass} bg-slate-50 text-slate-500`} />
          <p className="mt-1.5 text-xs text-slate-500">{t("settings.emailNote")}</p>
        </div>
        <Feedback state={state} successKey={{ saved: "settings.saved" }} />
        <Submit label={t("settings.save")} />
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<SettingsState, FormData>(changePassword, {});
  const { t } = useLocale();
  return (
    <Card title={t("settings.password")} body={t("settings.passwordBody")}>
      <form action={action} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="password">{t("settings.newPassword")}</label>
            <input id="password" name="password" type="password" required minLength={8} className={inputClass} autoComplete="new-password" />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm">{t("settings.confirmPassword")}</label>
            <input id="confirm" name="confirm" type="password" required minLength={8} className={inputClass} autoComplete="new-password" />
          </div>
        </div>
        <Feedback state={state} successKey={{ password: "settings.passwordUpdated" }} />
        <Submit label={t("settings.updatePassword")} />
      </form>
    </Card>
  );
}

export function DeletionForm() {
  const [state, action] = useActionState<SettingsState, FormData>(requestDeletion, {});
  const { t } = useLocale();
  const done = state.message === "deletion";
  return (
    <Card title={t("settings.danger")} body={t("settings.dangerBody")} danger>
      {done ? (
        <Feedback state={state} successKey={{ deletion: "settings.deletionSent" }} />
      ) : (
        <form action={action} className="space-y-5">
          <div>
            <label className={labelClass} htmlFor="reason">{t("settings.reason")}</label>
            <textarea id="reason" name="reason" rows={3} maxLength={1000} className={inputClass} />
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 flex-none rounded border-slate-300 accent-red-600" />
            <span>{t("settings.confirmDelete")}</span>
          </label>
          <Feedback state={state} successKey={{}} />
          <Submit label={t("settings.requestDelete")} danger />
        </form>
      )}
    </Card>
  );
}
