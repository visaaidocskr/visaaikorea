import "server-only";

import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/lib/i18n";

export const LOCALE_COOKIE = "visaai-locale";
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export async function getRequestLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
