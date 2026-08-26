import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/app/components/landing/Nav";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import { COUNTRIES, localizeCountryContent } from "@/lib/visa/countryContent";
import { VISA_PRICES, totalVisaPrice } from "@/lib/business";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Tourist visa guides for foreigners living in Korea: Japan, Taiwan, Singapore, Spain and Vietnam — documents, embassy notes and processing times.",
};

// Public index of every destination we prepare documents for. Each card
// links to the full country guide, which search engines can crawl — the
// homepage keeps its quick modal, this is the long-form version.
export default async function DestinationsPage() {
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  return (
    <div className="relative min-h-screen text-slate-900">
      <AuroraBackdrop />
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-600">
          <span aria-hidden className="sparkle text-cyan-500">✦</span>
          {t("countries.eyebrow")}
        </p>
        <h1 className="text-sky-gradient mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("countries.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">{t("countries.description")}</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTRIES.map((raw) => {
            const c = localizeCountryContent(raw, locale);
            const price = VISA_PRICES.find((v) => v.destination === raw.country);
            return (
              <Link
                key={c.key}
                href={`/destinations/${c.key}`}
                className="card-lift group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div aria-hidden className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-80 ${c.accent}`} />
                <div className="relative">
                  <div className="text-5xl drop-shadow-sm">{c.flag}</div>
                  <h2 className="mt-5 text-2xl font-bold">{c.country}</h2>
                  <p className="mt-1 text-sm text-slate-500">{c.tagline}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">{c.visaType}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-semibold">
                    {price && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        ${totalVisaPrice(price)}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      ⏱ {c.processingTime}
                    </span>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    {t("countries.details")}
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
