"use client";

import { useState } from "react";
import { Reveal } from "@/app/components/Reveal";
import { useLocale } from "@/app/components/LocaleProvider";

const COUNT = 9;
// The homepage shows the six most-asked questions; the rest unfold on demand
// so the page stays walkable.
const VISIBLE = 6;

// The questions clients ask in the first message, answered before they have
// to ask. Native <details> keeps it accessible and keyboard-friendly; the
// FAQPage JSON-LD lets search engines show the same answers in results.
export function FaqSection() {
  const { t } = useLocale();
  const [open, setOpen] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const items = Array.from({ length: COUNT }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <section id="faq" className="relative px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("faq.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("faq.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t("faq.description")}</p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-3 lg:grid-cols-2">
          {(showAll ? items : items.slice(0, VISIBLE)).map((it, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={Math.min(i, 5) * 60}>
                <details
                  open={isOpen}
                  className={`group rounded-2xl border bg-white transition-all ${
                    isOpen
                      ? "border-blue-300 shadow-md shadow-blue-500/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* React owns the open state: the summary click is intercepted
                      so only one answer is open at a time (accordion). */}
                  <summary
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(isOpen ? null : i);
                    }}
                    className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-left [&::-webkit-details-marker]:hidden"
                  >
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                        isOpen
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-base font-bold text-slate-900">{it.q}</span>
                    <span
                      aria-hidden
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border text-slate-500 transition-transform duration-300 ${
                        isOpen ? "rotate-45 border-blue-300 text-blue-600" : "border-slate-200"
                      }`}
                    >
                      +
                    </span>
                  </summary>
                  <div className="animate-fade-in px-5 pb-5 pl-[4.75rem] text-sm leading-relaxed text-slate-600">
                    {it.a}
                  </div>
                </details>
              </Reveal>
            );
          })}
        </div>

        {items.length > VISIBLE && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              {showAll ? t("faq.viewLess") : t("faq.viewAll")}
              <span aria-hidden className={`transition-transform ${showAll ? "rotate-180" : ""}`}>⌄</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
