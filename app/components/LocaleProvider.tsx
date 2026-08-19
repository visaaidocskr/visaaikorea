"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TRANSLATIONS, type Locale } from "@/lib/i18n";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: string) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "visaai-locale";

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const router = useRouter();
  // The cookie is the source of truth so Server Components, client pages, and
  // future visits all use the same language without a hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo(() => ({
    locale,
    setLocale: (next: Locale) => {
      if (next === locale) return;
      window.localStorage.setItem(STORAGE_KEY, next);
      setLocaleState(next);
      void fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      }).then((response) => {
        if (response.ok) router.refresh();
      });
    },
    t: (key: string) => TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key,
  }), [locale, router]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
