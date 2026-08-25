"use client";

import { useEffect } from "react";
import { BUSINESS } from "@/lib/business";
import { useLocale } from "@/app/components/LocaleProvider";

// Shown when the final submit button is pressed while submissions are
// closed (payment system under bank review). Warm, honest, and clear that
// nothing was lost — the work is saved and reopens with one tap.
export function ComingSoonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("soon.title")}
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-9"
      >
        <span aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl shadow-lg shadow-blue-500/30">
          🚀
        </span>
        <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {t("soon.title")}
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">{t("soon.body")}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-glow rounded-2xl px-6 py-3.5 font-bold text-white"
          >
            {t("soon.close")}
          </button>
          <a
            href={BUSINESS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
          >
            💬 {t("soon.contact")}
          </a>
        </div>
      </div>
    </div>
  );
}
