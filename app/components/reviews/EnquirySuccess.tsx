"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/app/components/LocaleProvider";
import { RatingPrompt } from "@/app/components/reviews/RatingPrompt";
import type { ReviewContext } from "./actions";

/**
 * Replaces a flight/tour form the moment the request is accepted — the same
 * drawn checkmark the visa wizard earns, so every flow ends with the same
 * unmistakable "it worked" moment. Scrolls itself into view: on a phone the
 * submit button lives at the bottom of a long form, and a message that
 * appears above the fold is a message nobody sees.
 */
export function EnquirySuccess({
  context,
  enquiryId,
  onReset,
}: {
  context: ReviewContext;
  enquiryId: string;
  onReset: () => void;
}) {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div
      ref={ref}
      className="enquiry-card animate-scale-in relative scroll-mt-24 overflow-hidden rounded-3xl p-8 text-center shadow-xl shadow-blue-200/40 sm:p-10 [--edge-a:#6EE7B7] [--edge-b:#93C5FD]"
    >
      {/* Drawn check */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="mx-auto"
        style={{ width: 88, height: 88 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="success-ring"
          cx="60"
          cy="60"
          r="52"
          stroke="url(#enquiry-grad)"
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
          <linearGradient id="enquiry-grad" x1="0" y1="0" x2="120" y2="120">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>

      <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {t("enquiry.successTitle")}
      </h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
        {t("enquiry.successBody")}
      </p>
      <p className="mx-auto mt-4 inline-flex max-w-md items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800">
        <span aria-hidden className="hourglass text-base">⏳</span>
        {t("enquiry.successNote")}
      </p>

      <RatingPrompt context={context} subjectId={enquiryId} className="mx-auto mt-7 max-w-md text-left" />

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="btn-glow inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 font-bold text-white"
        >
          <span aria-hidden className="sparkle text-cyan-200">✦</span>
          {t("apply.successCta")}
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {t("enquiry.another")}
        </button>
      </div>
    </div>
  );
}
