"use client";

import { useLocale } from "@/app/components/LocaleProvider";

// Shown during route transitions (e.g. navigating to /apply or the dashboard).
export default function Loading() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-sm text-white">
            V
          </span>
          <span className="text-slate-900">
            VisaAI <span className="text-blue-700">Korea</span>
          </span>
        </div>
        <div className="relative h-1 w-44 overflow-hidden rounded-full bg-slate-100">
          <div className="loader-sweep absolute inset-y-0 w-1/3 rounded-full bg-blue-600" />
        </div>
        <p className="text-sm text-slate-400">{t("loading.workspace")}</p>
      </div>
    </div>
  );
}
