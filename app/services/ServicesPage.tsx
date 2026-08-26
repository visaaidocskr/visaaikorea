"use client";

import Link from "next/link";
import { Footer } from "@/app/components/landing/Footer";
import { Nav } from "@/app/components/landing/Nav";
import { useLocale } from "@/app/components/LocaleProvider";
import { BUSINESS, VISA_PRICES, totalVisaPrice } from "@/lib/business";
import { GenerateButton } from "@/app/components/GenerateButton";

const PRICE_FLAGS: Record<string, string> = {
  Vietnam: "🇻🇳", Japan: "🇯🇵", Taiwan: "🇹🇼", Singapore: "🇸🇬", Spain: "🇪🇸",
};

export function ServicesPage() {
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
          {/* Desktop: a clean four-column table. Phones: one premium card per
              destination — no sideways scrolling, and the total is the
              loudest number on the card. */}
          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block">
            <div className="grid grid-cols-[1.2fr_.9fr_.9fr_.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{t("nav.destinations")}</span><span>{t("services.officialFee")}</span><span>{t("services.website")}</span><span>{t("services.total")}</span></div>
            {VISA_PRICES.map((price) => <div key={price.destination} className="grid grid-cols-[1.2fr_.9fr_.9fr_.8fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0"><div><strong>{PRICE_FLAGS[price.destination]} {price.destination}</strong>{price.note && <p className="mt-1 text-xs leading-relaxed text-slate-500">{price.note}</p>}</div><span>{price.embassyFeeUsd ? `$${price.embassyFeeUsd}` : t("services.paidSeparately")}</span><span>${price.serviceFeeUsd}</span><strong>${totalVisaPrice(price)}</strong></div>)}
          </div>
          <div className="mt-6 space-y-4 md:hidden">
            {VISA_PRICES.map((price) => (
              <div key={price.destination} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-extrabold">{PRICE_FLAGS[price.destination]} {price.destination}</p>
                  <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">${totalVisaPrice(price)}</p>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">{t("services.officialFee")}</dt><dd className="font-semibold">{price.embassyFeeUsd ? `$${price.embassyFeeUsd}` : t("services.paidSeparately")}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">{t("services.website")}</dt><dd className="font-semibold">${price.serviceFeeUsd}</dd></div>
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-1.5"><dt className="font-bold text-slate-700">{t("services.total")}</dt><dd className="font-extrabold">${totalVisaPrice(price)}</dd></div>
                </dl>
                {price.note && <p className="mt-2 text-xs leading-relaxed text-slate-500">{price.note}</p>}
              </div>
            ))}
            <GenerateButton full size="md" />
          </div>
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
      <Footer />
    </div>
  );
}

function ServiceCard({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return <div className="card-lift rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><h2 className="text-2xl font-extrabold">{title}</h2><p className="mt-3 min-h-16 text-sm leading-relaxed text-slate-600">{body}</p><Link href={href} className="mt-7 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100">{action} →</Link></div>;
}

function ContactCard({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-all text-sm font-semibold text-blue-700">{value}</p></a>;
}
