import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/app/components/landing/Nav";
import { GenerateButton } from "@/app/components/GenerateButton";
import { CountryAmbience } from "@/app/apply/CountryAmbience";
import { COUNTRIES, localizeCountryContent } from "@/lib/visa/countryContent";
import { VISA_PRICES, totalVisaPrice } from "@/lib/business";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

// Long-form public guide for one destination, assembled entirely from the
// same reviewed content the wizard uses — nothing is written twice, nothing
// can drift. The page wears the destination's ambience (tinted glow and a
// faint landmark) like the application itself.

type Params = Promise<{ country: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country } = await params;
  const raw = COUNTRIES.find((c) => c.key === country);
  if (!raw) return {};
  return {
    title: `${raw.country} Tourist Visa from Korea`,
    description: `${raw.visaType} — ${raw.tagline} Documents, embassy notes and processing times for foreigners living in South Korea.`,
  };
}

export default async function DestinationPage({ params }: { params: Params }) {
  const { country } = await params;
  const raw = COUNTRIES.find((c) => c.key === country);
  if (!raw) notFound();

  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  const c = localizeCountryContent(raw, locale);

  return (
    <div className="relative min-h-screen text-slate-900">
      <Nav />
      <CountryAmbience destination={raw.country} />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/destinations" className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800">
          ← {t("nav.destinations")}
        </Link>

        {/* Hero */}
        <section className={`mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br shadow-sm ${c.accent}`}>
          <div className="p-8 md:p-10">
            <div className="text-6xl drop-shadow-sm">{c.flag}</div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.country}</h1>
            <p className="mt-2 text-lg font-medium text-slate-700">{c.visaType}</p>
            <p className="mt-1 text-slate-600">{c.tagline}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-1.5 text-sm font-bold text-slate-700">
                ⏱ {c.processingTime}
              </span>
              <GenerateButton label={t("action.generate")} />
            </div>
          </div>
        </section>

        {/* Price facts: the same three numbers as the pricing page, so cost
            is never a click away. */}
        {(() => {
          const price = VISA_PRICES.find((v) => v.destination === raw.country);
          if (!price) return null;
          return (
            <section className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t("services.officialFee")}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{price.embassyFeeUsd ? `$${price.embassyFeeUsd}` : "—"}</p>
                {!price.embassyFeeUsd && <p className="mt-0.5 text-xs text-slate-500">{t("services.paidSeparately")}</p>}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t("services.website")}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">${price.serviceFeeUsd}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">{t("services.total")}</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-700">${totalVisaPrice(price)}</p>
              </div>
            </section>
          );
        })()}

        {/* Overview */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("countries.overview")}
          </h2>
          <p className="mt-3 leading-relaxed text-slate-700">{c.overview}</p>
        </section>

        {/* Documents */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("countries.documents")}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {c.documents.map((doc) => (
              <li key={doc} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <span aria-hidden className="mt-0.5 text-emerald-600">✓</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Notes */}
        {c.notes.length > 0 && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/70 p-7 shadow-sm md:p-8">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-700">
              <span aria-hidden className="sparkle text-amber-500">✦</span>
              {t("countries.notes")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {c.notes.map((note) => (
                <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-amber-950">
                  <span aria-hidden className="mt-0.5">⚠️</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Embassy / office */}
        {c.contacts.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-600">
              <span aria-hidden className="sparkle text-cyan-500">✦</span>
              {t("countries.office")}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {c.contacts.map((contact) => (
                <div key={contact.office} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-bold text-slate-900">{contact.office}</p>
                  <p className="mt-1 text-sm text-slate-600">{contact.address}</p>
                  <p className="mt-2 text-sm font-semibold text-blue-700">{contact.phone}</p>
                  {contact.email && <p className="text-sm font-semibold text-blue-700">{contact.email}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer + CTA */}
        <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">{t("countries.approval")}</p>
        <div className="mt-6 flex justify-center pb-10">
          <GenerateButton size="lg" label={t("action.generate")} className="btn-shine-auto" />
        </div>
      </main>
    </div>
  );
}
