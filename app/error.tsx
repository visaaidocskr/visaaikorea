"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

// Branded catch-all for unexpected render errors: apologise briefly, offer a
// retry and a way home, and never show a stack trace to an applicant.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-20 text-center text-slate-900">
      <p aria-hidden className="text-6xl">🛬</p>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("error.title")}
      </h1>
      <p className="mt-3 max-w-md text-lg leading-relaxed text-slate-600">
        {t("error.body")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-glow rounded-2xl px-7 py-3.5 font-bold text-white"
        >
          {t("error.retry")}
        </button>
        <Link
          href="/"
          className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          {t("notFound.home")}
        </Link>
      </div>
    </main>
  );
}
