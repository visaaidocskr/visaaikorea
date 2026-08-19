"use client";

import { LOCALE_OPTIONS } from "@/lib/i18n";
import { useLocale } from "@/app/components/LocaleProvider";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  return <label className="relative">
    <span className="sr-only">{t("language.label")}</span>
    <select value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
      {LOCALE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
    </select>
    <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">⌄</span>
  </label>;
}
