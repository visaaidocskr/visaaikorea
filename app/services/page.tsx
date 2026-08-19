"use client";

import Link from "next/link";
import { Nav } from "@/app/components/landing/Nav";
import { useLocale } from "@/app/components/LocaleProvider";
import { BUSINESS, VISA_PRICES, totalVisaPrice } from "@/lib/business";

export default function ServicesPage() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-600"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("services.eyebrow")}</p>
        <h1 className="text-sky-gradient mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{t("services.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">{t("services.description")}</p>

        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold">{t("services.visa")}</h2><p className="mt-2 text-sm text-slate-600">{t("services.planning")}</p></div><Link href="/apply" className="btn-glow rounded-2xl px-5 py-3 font-bold text-white">{t("action.startVisa")} →</Link></div>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white" tabIndex={0} aria-label={t("services.visa")}>
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1.2fr_.9fr_.9fr_.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{t("nav.destinations")}</span><span>{t("services.officialFee")}</span><span>{t("services.website")}</span><span>{t("services.total")}</span></div>
              {VISA_PRICES.map((price) => <div key={price.destination} className="grid grid-cols-[1.2fr_.9fr_.9fr_.8fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0"><div><strong>{price.destination}</strong>{price.note && <p className="mt-1 text-xs leading-relaxed text-slate-500">{price.note}</p>}</div><span>{price.embassyFeeUsd ? `$${price.embassyFeeUsd}` : t("services.paidSeparately")}</span><span>${price.serviceFeeUsd}</span><strong>${totalVisaPrice(price)}</strong></div>)}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:hidden">{t("services.swipe")}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">{t("services.disclaimer")}</p>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <ServiceCard title={t("service.c31")} body={t("service.c31Body")} href="/invite" action={`C-3-1 · $35`} />
          <ServiceCard title={t("service.flight")} body={t("service.flightBody")} href="/flights" action={t("action.requestFlight")} />
          <ServiceCard title={t("service.tour")} body={t("service.tourBody")} href="/tours" action={t("action.planTour")} />
        </section>

        <section className="mt-14 grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 md:grid-cols-2">
          <div><h2 className="text-xl font-extrabold">{t("services.safeTitle")}</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">{t("services.safeText")}</p></div>
          <div>
            <h2 className="text-xl font-extrabold">{t("services.help")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ContactCard label={t("services.email")} value={BUSINESS.email} href={`mailto:${BUSINESS.email}`} />
              <ContactCard label={t("services.uzPhone")} value={BUSINESS.phones.uzbekistan} href="tel:+998932362277" />
              <ContactCard label={t("services.krPhone")} value={BUSINESS.phones.korea} href="tel:+821033964499" />
              <ContactCard label={t("services.telegram")} value={t("services.contactTelegram")} href={BUSINESS.telegram} external />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ServiceCard({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return <div className="card-lift rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><h2 className="text-2xl font-extrabold">{title}</h2><p className="mt-3 min-h-16 text-sm leading-relaxed text-slate-600">{body}</p><Link href={href} className="mt-7 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100">{action} →</Link></div>;
}

function ContactCard({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-all text-sm font-semibold text-blue-700">{value}</p></a>;
}
