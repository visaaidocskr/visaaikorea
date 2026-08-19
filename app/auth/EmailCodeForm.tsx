"use client";

// Passwordless sign-in: address → six-digit code → in.
//
// Two server actions rather than one, because the steps fail differently: a
// bad address should not lose a code that was already sent, and a mistyped
// code should not send another one.
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendEmailCode, verifyEmailCode, type CodeState } from "@/app/auth/actions";
import { CodeInput } from "@/app/auth/CodeInput";
import { useLocale } from "@/app/components/LocaleProvider";

const RESEND_SECONDS = 60;

const inputClass =
  "w-full rounded-2xl border border-slate-300 px-5 py-4 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-blue-700 py-4 text-lg font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Problem({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"
    >
      {text}
    </p>
  );
}

export function EmailCodeForm({ next = "/dashboard" }: { next?: string }) {
  const { t } = useLocale();
  const [sendState, sendAction] = useActionState<CodeState, FormData>(
    sendEmailCode,
    {}
  );
  const [verifyState, verifyAction] = useActionState<CodeState, FormData>(
    verifyEmailCode,
    {}
  );
  // The address is whichever step last knew it: the verify action echoes it
  // back on failure so a wrong code doesn't drop us to step one.
  const email = verifyState.email ?? sendState.email ?? "";
  const onCodeStep = Boolean(sendState.sent || verifyState.sent);

  if (!onCodeStep) {
    return (
      <form action={sendAction} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="code-email">
            {t("form.email")}
          </label>
          <input
            id="code-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={email}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-slate-500">
            {t("auth.codeHelp")}
          </p>
        </div>
        <Problem text={sendState.error} />
        <SubmitButton label={t("auth.emailCode")} pendingLabel={t("auth.sending")} />
      </form>
    );
  }

  return (
    <CodeStep
      email={email}
      next={next}
      verifyAction={verifyAction}
      verifyState={verifyState}
      sendAction={sendAction}
      sentAt={sendState.sentAt}
    />
  );
}

function CodeStep({
  email,
  next,
  verifyAction,
  verifyState,
  sendAction,
  sentAt,
}: {
  email: string;
  next: string;
  verifyAction: (formData: FormData) => void;
  verifyState: CodeState;
  sendAction: (formData: FormData) => void;
  sentAt?: number;
}) {
  const { t } = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const submittedFor = useRef<string>("");

  // The countdown is derived from when the code was sent, not counted down by
  // a timer holding its own state. A resend moves `sentAt`, so the wait
  // restarts by itself — no effect has to notice and reset anything.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = sentAt ? Math.floor((now - sentAt) / 1000) : RESEND_SECONDS;
  const seconds = Math.max(0, RESEND_SECONDS - elapsed);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-600">
          {t("auth.codeSent")} <strong className="text-slate-900">{email}</strong>. {t("auth.codeExpiry")}
        </p>
      </div>

      <form action={verifyAction} ref={formRef} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <CodeInput
          onComplete={(code) => {
            // Submit as soon as the sixth digit lands — but only once per
            // code, or a failed attempt would resubmit itself in a loop.
            if (submittedFor.current === code) return;
            submittedFor.current = code;
            formRef.current?.requestSubmit();
          }}
        />
        <Problem text={verifyState.error} />
        <SubmitButton label={t("auth.signIn")} pendingLabel={t("auth.checking")} />
      </form>

      <form action={sendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="resend" value="1" />
        <ResendButton seconds={seconds} />
      </form>
    </div>
  );
}

function ResendButton({ seconds }: { seconds: number }) {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  if (seconds > 0) {
    return (
      <p className="text-sm text-slate-500">
        {t("auth.resendWait")} {seconds}s.
      </p>
    );
  }
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline disabled:opacity-50"
    >
      {pending ? t("auth.sending") : t("auth.resend")}
    </button>
  );
}
