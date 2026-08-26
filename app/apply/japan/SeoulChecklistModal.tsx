"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import type { DocumentRequirement } from "@/lib/visa/types";

type Route = "sticker" | "evisa";

type Props = {
  open: boolean;
  route: Route;
  /** Status-specific extra documents (enrollment/employment/business/etc.),
   * already resolved for the applicant's exact visa status + marital status.
   * At the point this modal is shown, the Korean visa status is usually not
   * yet known — in that case this array is empty and a generic description
   * of item 4 is shown instead. */
  statusDocs: DocumentRequirement[];
  onClose: () => void;
};

// Shown once, right after the applicant confirms "Destination" (Korea
// province) — for BOTH Japan routes, sticker (Busan Consulate) and eVisa
// (Seoul Embassy). The province already tells us the route; the exact
// Korean visa status is collected later on "Korea Status", so the
// status-specific proof document (enrollment / employment / business
// registration / marriage certificate) can't be named precisely yet and is
// described generically instead.
export function SeoulChecklistModal({ open, route, statusDocs, onClose }: Props) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isSticker = route === "sticker";

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

  if (!open) return null;

  const titleId = "japan-checklist-title";

  const preparedByUs = isSticker
    ? [t("jchk.itinerary"), t("jchk.formSticker")]
    : [t("jchk.itinerary"), t("jchk.personalInfo"), t("jchk.declaration")];

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
        className="animate-scale-in flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 px-6 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            {isSticker ? t("jchk.bannerSticker") : t("jchk.bannerEvisa")}
          </p>
          <h2 id={titleId} className="mt-0.5 text-xl font-extrabold">
{t("jchk.title")}
          </h2>
          <p className="mt-1 text-sm font-medium text-blue-100">
{t("jchk.subtitle")}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="space-y-6 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
{t("jchk.yourDocs")}
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
              <li>
                {isSticker ? t("jchk.passportSticker") : t("jchk.passport")}
              </li>
              <li>{t("jchk.arc")}</li>
              <li>
                {isSticker ? t("jchk.photoSticker") : t("jchk.photoEvisa")}
              </li>
              {statusDocs.length > 0 ? (
                statusDocs.map((d) => (
                  <li key={d.key}>
                    {d.labelEn}
                    {d.labelKo ? ` (${d.labelKo})` : ""}
                    {!d.required && !/\(if /i.test(d.labelEn) ? t("jchk.optionalMark") : ""}
                    {d.hint && <span className="block text-xs text-slate-500">{d.hint}</span>}
                  </li>
                ))
              ) : (
                <li>
{t("jchk.statusDocFallback")}
                  <span className="block text-xs text-slate-500">
{t("jchk.statusDocNote")}
                  </span>
                </li>
              )}
              <li>{t("jchk.contact")}</li>
              <li>
{t("jchk.bank")}
                <span className="mt-1 block rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
{t("jchk.bankNote")}
                </span>
              </li>
              <li>{t("jchk.flight")}</li>
              <li>{t("jchk.hotel")}</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-blue-900">
              <span aria-hidden>🤝</span> {t("jchk.escortTitle")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-blue-800">
{t("jchk.escortBody")}
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              <span aria-hidden>📄</span> {t("jchk.preparedTitle")}
            </h3>
            <ul className="mt-3 space-y-2">
              {preparedByUs.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 text-blue-600" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
{t("jchk.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
