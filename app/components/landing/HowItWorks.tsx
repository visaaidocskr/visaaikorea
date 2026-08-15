"use client";

import { useState } from "react";
import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";

const STEPS = [
  {
    n: "01",
    title: "Tell us about your trip",
    blurb:
      "Your nationality, Korean visa status, destination and travel dates. Upload your passport and we read the details for you.",
  },
  {
    n: "02",
    title: "We prepare your documents",
    blurb:
      "Your travel purpose statement, day-by-day itinerary and the exact checklist for your visa status — all generated from what you entered.",
  },
  {
    n: "03",
    title: "We check, then you download",
    blurb:
      "Our team reviews everything before release, so you never submit a document with a mistake in it. Flight and hotel reservations may take up to 16 hours.",
  },
];

export function HowItWorks() {
  const [step, setStep] = useState(0);

  return (
    <section id="how" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Three steps to embassy-ready
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Click each step to see exactly what happens.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2">
          {/* Steps */}
          <div className="relative space-y-4">
            {/* Static connection line linking the step badges */}
            <div className="pointer-events-none absolute bottom-12 left-[2.95rem] top-12 hidden w-px bg-slate-200 sm:block" />
            {STEPS.map((s, i) => {
              const activeStep = i === step;
              return (
                <Reveal key={s.n} delay={i * 80}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex w-full items-start gap-5 rounded-2xl border p-6 text-left transition-colors duration-200 ${
                      activeStep
                        ? "border-blue-300 bg-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl text-lg font-bold transition-colors ${
                        activeStep
                          ? "bg-blue-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.n}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {s.blurb}
                      </p>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* Preview */}
          <Reveal delay={120}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <div className="mb-5 flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-300" />
                <span className="h-3 w-3 rounded-full bg-amber-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-300" />
              </div>
              <div key={step} className="animate-scale-in">
                {step === 0 && <FormPreview />}
                {step === 1 && <DocsPreview />}
                {step === 2 && <DownloadPreview />}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

function FormPreview() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-900">Application details</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nationality" value="Uzbekistan" />
        <Field label="Korean visa status" value="D-2 Student" />
        <Field label="Destination" value="Japan · Tokyo" />
        <Field label="Travel dates" value="Jul 12 – Jul 18" />
      </div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
        We tailor required documents to your exact visa status automatically.
      </div>
    </div>
  );
}

function DocsPreview() {
  const docs = ["Travel Purpose Statement", "Daily Travel Itinerary", "Document Checklist"];
  // Absorbed from the old standalone "Services" section — the same points,
  // shown where they're actually relevant instead of in a separate block.
  const included = [
    "Destination-specific forms and checklist",
    "Details kept consistent across every document",
    "Companions included when you travel together",
    "Embassy submission notes for your route",
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-900">Preparing documents…</p>
      {docs.map((d, i) => (
        <div
          key={d}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            📄
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">{d}</p>
            <div className="mt-1.5 skeleton h-2 w-2/3" style={{ animationDelay: `${i * 120}ms` }} />
          </div>
          <span className="text-xs font-bold text-emerald-600">✓ Ready</span>
        </div>
      ))}
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Also included
        </p>
        <ul className="mt-2 space-y-1.5">
          {included.map((item) => (
            <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-600">
              <span className="text-blue-600">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DownloadPreview() {
  const files = [
    { name: "travel-purpose-statement.docx", size: "82 KB" },
    { name: "daily-itinerary.docx", size: "146 KB" },
    { name: "document-checklist.docx", size: "61 KB" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-900">Your document package</p>
      <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
        ✓ Reviewed by our team before release
      </div>
      {files.map((f) => (
        <div
          key={f.name}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              ⬇
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{f.name}</p>
              <p className="text-xs text-slate-400">{f.size}</p>
            </div>
          </div>
          <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
            Download
          </span>
        </div>
      ))}
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        Print, sign where required, and submit per the embassy steps included in
        your package.
      </div>
      <GenerateButton full size="md" />
    </div>
  );
}
