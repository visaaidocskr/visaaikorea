"use client";

import { useState } from "react";
import { Modal } from "@/app/components/Modal";
import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";

type Service = {
  icon: string;
  title: string;
  short: string;
  detail: string;
  includes: string[];
};

const SERVICES: Service[] = [
  {
    icon: "📑",
    title: "Tourist Visa Documents",
    short: "Every required form, tailored to your visa status and destination.",
    detail:
      "We assemble the complete set of documents an embassy expects for a tourist visa — application forms, supporting statements, and the right checklist for your nationality and Korean visa status. No guesswork, no missing pages.",
    includes: [
      "Destination-specific application form or information letter",
      "Required-document checklist by Korean visa status",
      "Travel purpose statement",
      "Applicant & companion list when traveling together",
    ],
  },
  {
    icon: "🗂️",
    title: "Embassy Document Package",
    short: "A complete, print-ready package organized the way embassies expect.",
    detail:
      "Beyond individual files, we deliver a coherent package: consistent dates, matching details across documents, and clear submission guidance — including sticker vs. eVISA routing for Japan and appointment rules for Schengen.",
    includes: [
      "Consistent applicant details across every document",
      "Embassy notes and submission instructions",
      "Bank-balance and insurance guidance",
      "Admin-prepared air ticket & hotel reservations after review",
    ],
  },
  {
    icon: "🗺️",
    title: "Travel Itinerary Generator",
    short: "Realistic, day-by-day itineraries that read like a genuine trip.",
    detail:
      "Our itinerary engine builds a believable, city-specific plan — morning, afternoon, and evening — rotating real points of interest so no two applicants get the same route. Companions are included where required.",
    includes: [
      "City-specific points of interest (Tokyo, Osaka, Taipei, Madrid…)",
      "Morning / afternoon / evening structure",
      "Stays kept within allowed visa durations",
      "Companion names and relationships included",
    ],
  },
];

export function ServicesSection() {
  const [active, setActive] = useState<Service | null>(null);

  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Services
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Everything in one package
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            One simple flow produces a complete, embassy-ready set of documents.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <button
                onClick={() => setActive(s)}
                className="group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-colors duration-200 hover:border-blue-300 hover:bg-slate-50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl ring-1 ring-blue-100">
                  {s.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {s.short}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  Learn more
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <Modal open={active !== null} onClose={() => setActive(null)} variant="center">
        {active && (
          <div className="p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-4xl ring-1 ring-blue-100">
              {active.icon}
            </div>
            <h3 className="mt-5 text-2xl font-bold text-slate-900">{active.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{active.detail}</p>

            <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
              What&apos;s included
            </h4>
            <ul className="mt-3 space-y-2">
              {active.includes.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 text-blue-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <GenerateButton full size="lg" />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
