"use client";

import { useState } from "react";
import { Reveal } from "@/app/components/Reveal";
import { useLocale } from "@/app/components/LocaleProvider";

export function HowItWorks() {
  const [step, setStep] = useState(0);
  const { t } = useLocale();
  const steps = [
    { n: "01", title: t("how.step1.title"), blurb: t("how.step1.body") },
    { n: "02", title: t("how.step2.title"), blurb: t("how.step2.body") },
    { n: "03", title: t("how.step3.title"), blurb: t("how.step3.body") },
  ];

  return (
    <section id="how" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("how.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("how.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("how.description")}
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2">
          {/* Steps */}
          <div className="relative space-y-4">
            {/* Route line linking the step badges, dashes always in motion */}
            <svg
              aria-hidden
              className="pointer-events-none absolute bottom-12 left-[2.9rem] top-12 hidden w-1 sm:block"
              preserveAspectRatio="none"
              viewBox="0 0 2 100"
            >
              <path
                className="route-flow"
                d="M1 0V100"
                stroke="#93C5FD"
                strokeWidth="2"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {steps.map((s, i) => {
              const activeStep = i === step;
              return (
                <Reveal key={s.n} delay={i * 80}>
                  <button
                    onClick={() => setStep(i)}
                    className={`card-lift flex w-full items-start gap-5 rounded-2xl border p-6 text-left ${
                      activeStep
                        ? "border-blue-300 bg-white shadow-md shadow-blue-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl text-lg font-bold transition-colors ${
                        activeStep
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
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
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-900">{t("how.applicationDetails")}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("how.nationality")} value="Uzbekistan" />
        <Field label={t("how.koreanStatus")} value="D-2 Student" />
        <Field label={t("how.destination")} value="Japan · Tokyo" />
        <Field label={t("how.travelDates")} value="Jul 12 – Jul 18" />
      </div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
        {t("how.tailored")}
      </div>
    </div>
  );
}

function DocsPreview() {
  const { t } = useLocale();
  const docs = ["Travel Purpose Statement", "Daily Travel Itinerary", "Document Checklist"];
  // Absorbed from the old standalone "Services" section — the same points,
  // shown where they're actually relevant instead of in a separate block.
  const included = [
    t("how.included1"), t("how.included2"), t("how.included3"), t("how.included4"),
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-900">{t("how.preparing")}</p>
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
          <span className="text-xs font-bold text-emerald-600">{t("how.ready")}</span>
        </div>
      ))}
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t("how.included")}
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
  const { t } = useLocale();
  const files = [
    { name: "travel-purpose-statement.docx", size: "82 KB" },
    { name: "daily-itinerary.docx", size: "146 KB" },
    { name: "document-checklist.docx", size: "61 KB" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-900">{t("how.package")}</p>
      <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
        {t("how.reviewed")}
      </div>
      {/* Two delivery routes: for Japan and Vietnam our agents submit, so the
          client downloads nothing; for the rest the client self-submits. */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
            <span aria-hidden>🤝</span>
            {t("how.routeAgent")}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-blue-700/80">{t("how.routeAgentBody")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span aria-hidden>⬇️</span>
            {t("how.routeSelf")}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{t("how.routeSelfBody")}</p>
        </div>
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
            {t("how.download")}
          </span>
        </div>
      ))}
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {t("how.print")}
      </div>
    </div>
  );
}
