"use client";

import { useLocale } from "@/app/components/LocaleProvider";

// Shown during route transitions (e.g. navigating to /apply or the dashboard).
export default function Loading() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm text-white shadow-md shadow-blue-500/30">
            V
          </span>
          <span className="text-slate-900">
            VisaAI <span className="text-blue-700">Korea</span>
          </span>
        </div>
        <div className="relative h-1.5 w-56 overflow-visible rounded-full bg-slate-100">
          <div className="loader-sweep absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500">
            <span aria-hidden className="absolute -right-3 -top-2.5 text-sm">✈️</span>
          </div>
        </div>
        <p className="text-sm text-slate-400">{t("loading.workspace")}</p>
      </div>
    </div>
  );
}
