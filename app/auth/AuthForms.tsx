"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signIn,
  signUp,
  forgotPassword,
  type AuthState,
} from "@/app/auth/actions";

const inputClass =
  "w-full rounded-2xl border border-slate-300 px-5 py-4 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-blue-700 py-4 text-lg font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending ? "Please wait…" : label}
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

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required className={inputClass} placeholder="••••••••" />
      </div>
      <Feedback state={state} />
      <SubmitButton label="Sign In" />
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="full_name">
          Full name
        </label>
        <input id="full_name" name="full_name" type="text" className={inputClass} placeholder="As written in your passport" />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          Phone number
        </label>
        <input id="phone" name="phone" type="tel" className={inputClass} placeholder="010-0000-0000" />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} placeholder="At least 8 characters" />
      </div>
      <Feedback state={state} />
      <SubmitButton label="Create Account" />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(forgotPassword, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <Feedback state={state} />
      <SubmitButton label="Send Reset Link" />
    </form>
  );
}
