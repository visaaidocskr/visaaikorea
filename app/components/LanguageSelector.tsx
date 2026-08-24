"use client";

import { LOCALE_OPTIONS } from "@/lib/i18n";
import { useLocale } from "@/app/components/LocaleProvider";

export function LanguageSelector({
  compact = false,
  dark = false,
}: {
  // Compact: a small "🌐 EN" pill for narrow headers — the full-width native
  // select sits invisibly on top, so a tap opens the phone's own picker.
  compact?: boolean;
  dark?: boolean;
} = {}) {
  const { locale, setLocale, t } = useLocale();
  if (compact) {
    return (
      <label
        className={`relative inline-flex h-10 cursor-pointer items-center gap-1 rounded-xl border px-2.5 text-sm font-bold ${
          dark ? "border-white/25 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <span aria-hidden>🌐</span>
        {locale.toUpperCase()}
        <span aria-hidden className="text-[10px] opacity-70">⌄</span>
        <span className="sr-only">{t("language.label")}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as typeof locale)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  }
  return <label className="relative">
    <span className="sr-only">{t("language.label")}</span>
    <select value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
      {LOCALE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
    </select>
    <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">⌄</span>
  </label>;
}
