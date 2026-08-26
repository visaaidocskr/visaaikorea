"use client";

import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";
import { useLocale } from "@/app/components/LocaleProvider";

// The closing block: one confident question, one button — the same night
// sky the page opened with, so the story ends where it began.
export function FinalCta() {
  const { t } = useLocale();
  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-orb absolute -left-32 top-0 h-96 w-96 [--orb-c:rgba(37,99,235,0.28)]" />
        <div className="glow-orb absolute -right-32 bottom-0 h-96 w-96 [--orb-c:rgba(6,182,212,0.18)]" />
        <svg className="absolute inset-x-0 top-8 h-14 w-full" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path className="route-flow" d="M0 30C360 52 1080 8 1440 30" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 9" />
        </svg>
      </div>
      <Reveal className="relative mx-auto max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
          {t("cta.body")}
        </p>
        <div className="mt-9 flex justify-center">
          <GenerateButton size="lg" className="btn-shine-auto" />
        </div>
      </Reveal>
    </section>
  );
}
