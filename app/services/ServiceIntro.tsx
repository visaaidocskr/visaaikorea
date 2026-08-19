"use client";

import Link from "next/link";
import { useLocale } from "@/app/components/LocaleProvider";

export function ServiceIntro({ kind }: { kind: "flight" | "tour" }) {
  const { t } = useLocale();
  const isFlight = kind === "flight";
  return <section className="lg:pt-8">
    <Link href="/services" className="text-sm font-semibold text-blue-700 hover:underline">← {t("action.allServices")}</Link>
    <p className="mt-8 text-sm font-bold uppercase tracking-widest text-blue-600">{t(isFlight ? "flight.eyebrow" : "tour.eyebrow")}</p>
    <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{t(isFlight ? "flight.title" : "tour.title")}</h1>
    <p className="mt-5 text-lg leading-relaxed text-slate-600">{t(isFlight ? "flight.description" : "tour.description")}</p>
    {isFlight ? <ul className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
      {["flight.one", "flight.two", "flight.three"].map((key, index) => <li key={key} className="flex gap-3"><span className="font-bold text-blue-700">0{index + 1}</span><span>{t(key)}</span></li>)}
    </ul> : <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950"><strong>{t("tour.honest")}</strong> {t("tour.honestText")}</div>}
  </section>;
}
