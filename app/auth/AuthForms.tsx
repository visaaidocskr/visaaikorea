"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { EmailCodeForm } from "@/app/auth/EmailCodeForm";
import { useLocale } from "@/app/components/LocaleProvider";
import {
  signIn,
  signUp,
  signInWithGoogle,
  forgotPassword,
  type AuthState,
} from "@/app/auth/actions";

const inputClass =
  "w-full rounded-2xl border border-slate-300 px-5 py-4 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-blue-700 py-4 text-lg font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending ? t("auth.wait") : label}
    </button>
  );
}

function Feedback({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
        {state.message}
      </p>
    );
  }
  return null;
}

// Google's own mark. Inlined rather than an <img> so it can't fail to load
// on a slow connection and leave a naked button — this is the first thing
// most applicants will reach for.
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function GoogleButtonInner() {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white py-4 text-base font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        t("auth.openingGoogle")
      ) : (
        <>
          <GoogleMark />
          {t("auth.continueGoogle")}
        </>
      )}
    </button>
  );
}

/**
 * Google sign-in, offered above the email form because it's the path most
 * applicants will complete: no password to invent, no confirmation email to
 * go and find.
 */
export function GoogleButton({ next = "/" }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signInWithGoogle, {});
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <form action={action}>
        <input type="hidden" name="next" value={next} />
        <GoogleButtonInner />
      </form>
      <Feedback state={state} />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t("auth.or")}
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}

/**
 * The email half of the sign-in page: a code by default, a password if they
 * want one.
 *
 * The code is the default because it asks less — an address, and six digits
 * they can read off a notification. The password form stays one click away
 * for everyone who already has one and would rather use it than wait for an
 * email.
 */
export function SignInMethods({ next }: { next: string }) {
  const [usePassword, setUsePassword] = useState(false);
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      {usePassword ? <LoginForm next={next} /> : <EmailCodeForm next={next} />}

      <p className="text-center text-sm">
        <button
          type="button"
          onClick={() => setUsePassword((v) => !v)}
          className="font-semibold text-blue-700 underline-offset-4 hover:underline"
        >
          {usePassword
            ? t("auth.emailCodeInstead")
            : t("auth.passwordInstead")}
        </button>
      </p>
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  const { t } = useLocale();
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className={labelClass} htmlFor="email">
          {t("form.email")}
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          {t("auth.password")}
        </label>
        <input id="password" name="password" type="password" required className={inputClass} placeholder="••••••••" />
      </div>
      <Feedback state={state} />
      <SubmitButton label={t("auth.signIn")} />
    </form>
  );
}

// Links to the policies, for the "by continuing you agree" line and the
// signup checkbox. Word order differs by language, so the sentence is built
// from before/after fragments around the two links.
function PolicyLinks() {
  const { t } = useLocale();
  const cls = "font-semibold text-blue-700 underline-offset-4 hover:underline";
  return (
    <>
      <Link href="/terms" className={cls} target="_blank">{t("auth.termsLink")}</Link>
      {t("auth.consentAnd")}
      <Link href="/privacy" className={cls} target="_blank">{t("auth.privacyLink")}</Link>
    </>
  );
}

/**
 * Shown under every sign-in method. Google and the email code create an
 * account without a form to tick, so the agreement is expressed the way the
 * large platforms do it: continuing is accepting. The password signup form
 * additionally asks for an explicit tick.
 */
export function ConsentNote() {
  const { t } = useLocale();
  return (
    <p className="text-center text-xs leading-relaxed text-slate-500">
      {t("auth.consentBefore")}
      <PolicyLinks />
      {t("auth.consentAfter")}
    </p>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});
  const { t } = useLocale();
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="full_name">
          {t("auth.fullName")}
        </label>
        <input id="full_name" name="full_name" type="text" className={inputClass} placeholder={t("auth.passportName")} />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          {t("auth.phone")}
        </label>
        <input id="phone" name="phone" type="tel" className={inputClass} placeholder="010-0000-0000" />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          {t("form.email")}
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          {t("auth.password")}
        </label>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} placeholder={t("auth.passwordHint")} />
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 flex-none rounded border-slate-300 accent-blue-600"
        />
        <span>
          {t("auth.checkboxBefore")}
          <PolicyLinks />
          {t("auth.checkboxAfter")}
        </span>
      </label>
      <Feedback state={state} />
      <SubmitButton label={t("auth.createAccount")} />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(forgotPassword, {});
  const { t } = useLocale();
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="email">
          {t("form.email")}
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <Feedback state={state} />
      <SubmitButton label={t("auth.reset")} />
    </form>
  );
}
