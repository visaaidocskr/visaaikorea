"use client";

import Link from "next/link";
import { useLocale } from "@/app/components/LocaleProvider";
import { RatingPrompt } from "@/app/components/reviews/RatingPrompt";

// Shown in place of the wizard the moment an application is submitted.
// A drawn checkmark, a plane lifting off, and a promise: we take it from
// here — watch My results for the decision.
export function SubmitSuccess({ applicationId }: { applicationId?: string }) {
  const { t } = useLocale();
  return (
    <div className="animate-scale-in mx-auto max-w-xl py-10 text-center">
      {/* Drawn check */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="mx-auto"
        style={{ width: 96, height: 96 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="success-ring"
          cx="60"
          cy="60"
          r="52"
          stroke="url(#success-grad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          className="success-check"
          d="M38 62L54 78L84 46"
          stroke="#059669"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="success-grad" x1="0" y1="0" x2="120" y2="120">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>

      {/* A plane lifting off under the check */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 90"
        className="mx-auto mt-2 h-16 w-full max-w-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="route-flow"
          d="M20 72C110 66 220 44 380 16"
          stroke="#93C5FD"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 9"
        />
        <g transform="translate(60 58)">
          <g className="flight-takeoff">
            <path d="M-16 0L13 -8L30 -2.5L13 4L1.5 14.5H-6.5L-2.5 4L-16 0Z" fill="#2563EB" />
          </g>
        </g>
      </svg>

      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {t("apply.successTitle")}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-slate-600">
        {t("apply.successBody")}
      </p>
      <p className="mx-auto mt-4 inline-flex max-w-md items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800">
        <span aria-hidden className="hourglass text-base">⏳</span>
        {t("apply.successEta")}
      </p>

      {applicationId && (
        <RatingPrompt
          context="visa_application"
          subjectId={applicationId}
          className="mx-auto mt-8 max-w-md text-left"
        />
      )}

      <div className="mt-8">
        <Link
          href="/"
          className="btn-glow inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-bold text-white"
        >
          <span aria-hidden className="sparkle text-cyan-200">✦</span>
          {t("apply.successCta")}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
