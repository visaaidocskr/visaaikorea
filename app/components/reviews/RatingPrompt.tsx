"use client";

import { useState, useTransition } from "react";
import { BUSINESS } from "@/lib/business";
import { useLocale } from "@/app/components/LocaleProvider";
import { submitReview, type ReviewContext } from "./actions";

/**
 * The 1–5 star prompt shown at the end of a flow, ChatGPT-style: optional,
 * two seconds to answer, never in the way of the success message above it.
 *
 * The one deliberate asymmetry: a low rating (1–3) opens a "what went
 * wrong?" box and a WhatsApp line, so disappointment lands in our inbox
 * while it is still fixable — a high rating just says thank you.
 */
export function RatingPrompt({
  context,
  subjectId,
  className = "",
}: {
  context: ReviewContext;
  subjectId: string;
  className?: string;
}) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = hover || rating;
  const low = rating > 0 && rating <= 3;
  const labels = [t("rate.l1"), t("rate.l2"), t("rate.l3"), t("rate.l4"), t("rate.l5")];

  function send() {
    if (!rating || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await submitReview({ context, subjectId, rating, comment });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  if (done) {
    return (
      <div className={`animate-scale-in rounded-3xl border border-emerald-200 bg-emerald-50/80 px-6 py-5 text-center ${className}`}>
        <p aria-hidden className="text-2xl">{low ? "🤝" : "💙"}</p>
        <p className="mt-1 font-bold text-emerald-800">{low ? t("rate.thanksLow") : t("rate.thanks")}</p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-700">
          {low ? t("rate.thanksLowBody") : t("rate.thanksBody")}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 text-center shadow-sm ${className}`}>
      <p className="font-bold text-slate-900">{t("rate.title")}</p>
      <p className="mt-0.5 text-sm text-slate-500">{t("rate.subtitle")}</p>

      <div
        className="mt-4 flex items-center justify-center gap-1.5"
        role="radiogroup"
        aria-label={t("rate.title")}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={labels[n - 1]}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => setRating(n)}
            className="rate-star p-1"
            data-active={n <= active}
            data-chosen={rating > 0 && n <= rating}
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
              <path
                d="M12 2.6l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.42l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.94L12 2.6z"
                fill={n <= active ? "url(#star-fill)" : "#E2E8F0"}
                stroke={n <= active ? "#F59E0B" : "#CBD5E1"}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
        {/* Shared gradient for the filled stars. */}
        <svg width="0" height="0" aria-hidden>
          <defs>
            <linearGradient id="star-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className={`mt-1.5 h-5 text-sm font-semibold ${low ? "text-amber-600" : "text-slate-600"}`} aria-live="polite">
        {active ? labels[active - 1] : ""}
      </p>

      {rating > 0 && (
        <div className="animate-fade-in mt-3 space-y-3 text-left">
          <label className="block">
            <span className={`text-sm font-semibold ${low ? "text-amber-700" : "text-slate-700"}`}>
              {low ? t("rate.lowLabel") : t("rate.commentLabel")}
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={low ? 3 : 2}
              maxLength={1000}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          {low && (
            <a
              href={BUSINESS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
            >
              💬 {t("rate.lowContact")}
            </a>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>
          )}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={send}
              disabled={pending}
              className="btn-glow rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {t("rate.submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
