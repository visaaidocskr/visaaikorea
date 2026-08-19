import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/locale-server";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const locale = body && typeof body === "object" && "locale" in body
    ? (body as { locale?: unknown }).locale
    : undefined;

  if (typeof locale !== "string" || !(LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE, locale as Locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
