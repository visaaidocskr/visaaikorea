"use client";

import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";
import { useLocale } from "@/app/components/LocaleProvider";

export function HomeHero() {
  const { t } = useLocale();
  return <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50/40 px-6 pb-24 pt-16 sm:pt-24"><div className="mx-auto max-w-5xl text-center">
    <Reveal><div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t("hero.badge")}</div></Reveal>
    <Reveal delay={80}><h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-7xl">{t("hero.title1")}<br /><span className="text-blue-700">{t("hero.title2")}</span></h1></Reveal>
    <Reveal delay={160}><p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">{t("hero.description")}</p></Reveal>
    <Reveal delay={200}><p className="mt-4 text-sm font-medium text-slate-500">{t("hero.by")} <span className="font-semibold text-slate-700">Vitamin Travel</span></p></Reveal>
    <Reveal delay={240}><div className="mt-8 flex justify-center"><GenerateButton size="lg" /></div></Reveal>
    <Reveal delay={320}><div className="mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><span className="text-emerald-600">✓</span>{t("hero.prices")}</span><span className="inline-flex items-center gap-2"><span className="text-emerald-600">✓</span>{t("hero.drafts")}</span><span className="inline-flex items-center gap-2"><span className="text-emerald-600">✓</span>{t("hero.support")}</span></div><p className="mt-5 text-sm text-slate-400">{t("hero.destinations")}</p></Reveal>
  </div></section>;
}
