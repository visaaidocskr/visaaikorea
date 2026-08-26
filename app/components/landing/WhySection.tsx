"use client";

import { Reveal } from "@/app/components/Reveal";
import { useLocale } from "@/app/components/LocaleProvider";

const ITEMS = [
  { icon: "🇰🇷", titleKey: "why.korea", bodyKey: "why.koreaBody", accent: "from-blue-600 to-indigo-600" },
  { icon: "🏷️", titleKey: "why.pricing", bodyKey: "why.pricingBody", accent: "from-emerald-500 to-teal-600" },
  { icon: "🛡️", titleKey: "why.human", bodyKey: "why.humanBody", accent: "from-cyan-500 to-blue-600" },
  { icon: "💾", titleKey: "why.save", bodyKey: "why.saveBody", accent: "from-violet-500 to-indigo-600" },
] as const;

// Four concrete differentiators — each one is a real product behaviour, not
// a slogan.
export function WhySection() {
  const { t } = useLocale();
  return (
    <section id="why" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("why.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("why.title")}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {ITEMS.map((item, i) => (
            <Reveal key={item.titleKey} delay={i * 80}>
              <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <span aria-hidden className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-2xl shadow-lg`}>
                  {item.icon}
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(item.bodyKey)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
