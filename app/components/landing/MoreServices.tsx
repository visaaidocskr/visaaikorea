"use client";

import Link from "next/link";
import { Reveal } from "@/app/components/Reveal";
import { useLocale } from "@/app/components/LocaleProvider";

// Secondary products, deliberately quieter than the visa funnel: one compact
// card each, side by side, below the main story.
export function MoreServices() {
  const { t } = useLocale();
  const linkCls =
    "mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 transition-colors hover:text-blue-800";
  return (
    <section id="more" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("more.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("more.title")}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="card-lift relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <span aria-hidden className="pointer-events-none absolute -right-4 -top-6 select-none text-8xl opacity-[.07]">💌</span>
              <p aria-hidden className="text-3xl">🇺🇿✈️🇰🇷</p>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">{t("more.inviteTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("more.inviteBody")}</p>
              <Link href="/invite" className={linkCls}>
                {t("more.inviteCta")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="card-lift relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <span aria-hidden className="pointer-events-none absolute -right-4 -top-6 select-none text-8xl opacity-[.07]">🌏</span>
              <p aria-hidden className="text-3xl">✈️🏨🌴</p>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">{t("more.travelTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("more.travelBody")}</p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/flights" className={linkCls.replace("mt-5 ", "")}>
                  {t("nav.flights")}
                  <span aria-hidden>→</span>
                </Link>
                <Link href="/tours" className={linkCls.replace("mt-5 ", "")}>
                  {t("nav.tours")}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
