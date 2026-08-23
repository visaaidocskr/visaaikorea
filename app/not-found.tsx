import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/app/components/landing/Nav";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Page not found" };

// A wrong link should still land somewhere that looks like us and points
// back to the three things a visitor most likely wanted.
export default async function NotFound() {
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  return (
    <div className="relative min-h-screen text-slate-900">
      <AuroraBackdrop />
      <Nav />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-20 text-center">
        <div className="relative">
          <span aria-hidden className="text-sky-gradient text-[7rem] font-extrabold leading-none tracking-tight sm:text-[9rem]">
            404
          </span>
          <span aria-hidden className="flight-takeoff absolute -right-6 top-2 text-3xl sm:-right-10 sm:text-4xl">
            ✈️
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("notFound.title")}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">{t("notFound.body")}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-glow inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white">
            {t("notFound.home")} →
          </Link>
          <Link href="/destinations" className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50">
            {t("nav.destinations")}
          </Link>
          <Link href="/services" className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50">
            {t("nav.services")}
          </Link>
        </div>
      </main>
    </div>
  );
}
