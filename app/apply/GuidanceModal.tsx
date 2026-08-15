"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  CountryGuidance,
  DestinationRule,
  Recommendation,
} from "@/lib/visa/destinations";
import type { EligibilityResult } from "@/lib/visa/eligibility";

const FLAGS: Record<string, string> = {
  Japan: "🇯🇵",
  Taiwan: "🇹🇼",
  Singapore: "🇸🇬",
  Spain: "🇪🇸",
};

type Props = {
  open: boolean;
  destination: string;
  rule: DestinationRule | null;
  guidance: CountryGuidance | null;
  eligibility: EligibilityResult | null;
  recommendation: Recommendation | null;
  onApplyRecommended?: () => void;
  onClose: () => void;
};

// Premium, embassy-style country guidance dialog. Focus-trapped, scroll-locked,
// animated, mobile-friendly (bottom sheet on small screens). Renders bespoke
// per-country content authored in COUNTRY_GUIDANCE.
export function GuidanceModal({
  open,
  destination,
  rule,
  guidance,
  eligibility,
  recommendation,
  onApplyRecommended,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const focusables = useCallback(() => {
    const root = dialogRef.current;
    if (!root) return [] as HTMLElement[];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));
  }, []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => focusables()[0]?.focus());
    return () => {
      document.body.style.overflow = overflow;
      window.cancelAnimationFrame(id);
      previouslyFocused?.focus?.();
    };
  }, [open, focusables]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const els = focusables();
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!open || !rule || !guidance) return null;

  const titleId = "guidance-modal-title";
  const descId = "guidance-modal-desc";
  const flag = FLAGS[destination] ?? "🗺️";
  const hasDates = Boolean(
    recommendation?.recommendedStartISO && recommendation?.recommendedEndISO
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="animate-scale-in flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 px-6 py-6 text-white">
          <div className="flex items-start gap-4">
            <span className="text-4xl leading-none drop-shadow-sm" aria-hidden>
              {flag}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                Official visa information
              </p>
              <h2 id={titleId} className="mt-0.5 text-xl font-extrabold">
                {destination} tourist visa
              </h2>
              {eligibility && (
                <p id={descId} className="mt-1 text-sm font-medium text-blue-100">
                  {eligibility.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="space-y-5 overflow-y-auto px-6 py-6">
          <Section icon="🛂" title="Visa validity">
            {guidance.visaValidity}
          </Section>
          <Section icon="⏳" title="Maximum stay">
            {guidance.maxStay}
          </Section>
          <Section icon="⚙️" title="Processing time">
            {guidance.processingTime}
          </Section>
          <Section icon="📅" title="Why recommended travel dates exist">
            {guidance.whyRecommendedDates}
          </Section>

          {/* Warning */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <span aria-hidden>⚠️</span> Risk of booking too close to submission
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-800">
              {guidance.risksTooClose}
            </p>
          </div>

          <Section icon="🧭" title="Recommended trip duration">
            {guidance.recommendedDuration}
          </Section>

          {/* Concrete recommendation */}
          {recommendation && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-800">
                <span aria-hidden>✨</span> Your recommended plan
              </h3>
              <dl className="mt-3 space-y-1.5 text-sm text-blue-900">
                <Row
                  k="Travel start"
                  v={
                    recommendation.recommendedStartISO
                      ? prettyDate(recommendation.recommendedStartISO)
                      : `at least ${recommendation.leadDays} days after your ${rule.anchorLabel.toLowerCase()}`
                  }
                />
                <Row
                  k="Recommended stay"
                  v={`${recommendation.stayMin}–${recommendation.stayMax} days`}
                />
                <Row k="Maximum stay" v={`${recommendation.maxStayDays} days`} />
              </dl>
              {!hasDates && (
                <p className="mt-2 text-xs text-blue-700">
                  Set your {rule.anchorLabel.toLowerCase()} to see exact dates you can apply.
                </p>
              )}
            </div>
          )}

          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              <span aria-hidden>📌</span> Important application notes
            </h3>
            <ul className="mt-3 space-y-2">
              {guidance.importantNotes.map((n) => (
                <li key={n} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 text-blue-600" aria-hidden>•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white p-5">
          {hasDates && onApplyRecommended && (
            <button
              type="button"
              onClick={() => {
                onApplyRecommended();
                onClose();
              }}
              className="rounded-2xl border border-blue-300 px-5 py-3 font-bold text-blue-700 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Use recommended dates
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
        <span aria-hidden>{icon}</span> {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{children}</p>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-semibold text-blue-700">{k}</dt>
      <dd className="text-right font-bold">{v}</dd>
    </div>
  );
}

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}
