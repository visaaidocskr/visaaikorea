"use client";

import { useState } from "react";
import Link from "next/link";
import { COUNTRIES, localizeCountryContent, type CountryContent } from "@/lib/visa/countryContent";
import { VISA_PRICES, totalVisaPrice } from "@/lib/business";
import { Modal } from "@/app/components/Modal";
import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";
import { useLocale } from "@/app/components/LocaleProvider";

export function CountriesSection() {
  const [active, setActive] = useState<CountryContent | null>(null);
  const { locale, t } = useLocale();

  return (
    <section id="countries" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("countries.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("countries.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("countries.description")}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTRIES.map((country, i) => {
            const c = localizeCountryContent(country, locale);
            const price = VISA_PRICES.find((v) => v.destination === country.country);
            return (
            <Reveal key={c.country} delay={i * 80}>
              <div className="h-full">
              <button
                onClick={() => setActive(c)}
                className="card-lift group relative h-full w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm"
              >
                <div aria-hidden className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-80 ${c.accent}`} />
                <span
                  aria-hidden
                  className="absolute right-6 top-6 -translate-x-4 text-xl opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
                >
                  ✈️
                </span>
                <div className="relative">
                  <div className="text-5xl drop-shadow-sm">
                    {c.flag}
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-900">
                    {c.country}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{c.tagline}</p>
                  {/* The two facts a visitor actually compares: total price
                      (embassy + service, nothing hidden) and how long the
                      embassy usually takes. */}
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
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </div>
              </button>
              </div>
            </Reveal>
            );
          })}
        </div>
      </div>

      <Modal open={active !== null} onClose={() => setActive(null)} variant="right">
        {active && <CountryPanel c={active} />}
      </Modal>
    </section>
  );
}

function CountryPanel({ c }: { c: CountryContent }) {
  const { locale, t } = useLocale();
  const localized = localizeCountryContent(c, locale);
  return (
    <div className="flex min-h-full flex-col">
      <div className={`bg-gradient-to-br p-8 ${localized.accent}`}>
        <div className="text-6xl">{localized.flag}</div>
        <h3 className="mt-4 text-3xl font-bold text-slate-900">{localized.country}</h3>
        <p className="mt-1 font-medium text-slate-600">{localized.visaType}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-slate-700 backdrop-blur">
          ⏱ {localized.processingTime}
        </div>
        <div className="mt-3">
          <Link
            href={`/destinations/${localized.key}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 transition-colors hover:text-blue-800"
          >
            {t("countries.fullGuide")} →
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-7 p-8">
        <Block title={t("countries.overview")}>
          <p className="text-sm leading-relaxed text-slate-600">{localized.overview}</p>
        </Block>

        <Block title={t("countries.documents")}>
          <ul className="space-y-2">
            {localized.documents.map((d) => (
              <li key={d} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t("countries.notes")}>
          <ul className="space-y-2">
            {localized.notes.map((n) => (
              <li key={n} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Block>

        {c.contacts.length > 0 && (
          <Block title={t("countries.office")}>
            <div className="space-y-3">
              {c.contacts.map((ct) => (
                <div
                  key={ct.office}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm"
                >
                  <p className="font-semibold text-slate-900">{ct.office}</p>
                  <p className="mt-1 text-slate-600">{ct.address}</p>
                  <p className="text-slate-600">{ct.phone}</p>
                  {ct.email && <p className="text-blue-600">{ct.email}</p>}
                </div>
              ))}
            </div>
          </Block>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-100 bg-white/90 p-6 backdrop-blur">
        <GenerateButton full label={t("action.generate")} />
        <p className="mt-3 text-center text-xs text-slate-400">
          {t("countries.approval")}
        </p>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h4>
      {children}
    </div>
  );
}
