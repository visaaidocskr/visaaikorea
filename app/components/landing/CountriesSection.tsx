"use client";

import { useState } from "react";
import { COUNTRIES, type CountryContent } from "@/lib/visa/countryContent";
import { Modal } from "@/app/components/Modal";
import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";

export function CountriesSection() {
  const [active, setActive] = useState<CountryContent | null>(null);

  return (
    <section id="countries" className="bg-slate-50/70 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Destinations
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Choose where you&apos;re going
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Tap a country to see its visa overview, required documents, and
            embassy notes — then generate your package.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTRIES.map((c, i) => (
            <Reveal key={c.country} delay={i * 80}>
              <div className="h-full">
              <button
                onClick={() => setActive(c)}
                className="group relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-colors duration-200 hover:border-blue-300 hover:bg-slate-50"
              >
                <div className="relative">
                  <div className="text-5xl">
                    {c.flag}
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-900">
                    {c.country}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{c.tagline}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    View details
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </div>
              </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Modal open={active !== null} onClose={() => setActive(null)} variant="right">
        {active && <CountryPanel c={active} />}
      </Modal>
    </section>
  );
}

function CountryPanel({ c }: { c: CountryContent }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className={`bg-gradient-to-br p-8 ${c.accent}`}>
        <div className="text-6xl">{c.flag}</div>
        <h3 className="mt-4 text-3xl font-bold text-slate-900">{c.country}</h3>
        <p className="mt-1 font-medium text-slate-600">{c.visaType}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-slate-700 backdrop-blur">
          ⏱ {c.processingTime}
        </div>
      </div>

      <div className="flex-1 space-y-7 p-8">
        <Block title="Overview">
          <p className="text-sm leading-relaxed text-slate-600">{c.overview}</p>
        </Block>

        <Block title="Required documents">
          <ul className="space-y-2">
            {c.documents.map((d) => (
              <li key={d} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Important embassy notes">
          <ul className="space-y-2">
            {c.notes.map((n) => (
              <li key={n} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Block>

        {c.contacts.length > 0 && (
          <Block title="Embassy / office">
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
        <GenerateButton full label={`Generate ${c.country} Documents`} />
        <p className="mt-3 text-center text-xs text-slate-400">
          Approval is decided only by the embassy. We prepare your documents.
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
