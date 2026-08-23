"use client";

import Link from "next/link";
import { Nav } from "@/app/components/landing/Nav";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import { CountriesSection } from "@/app/components/landing/CountriesSection";
import { InviteSection } from "@/app/components/landing/InviteSection";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { FaqSection } from "@/app/components/landing/FaqSection";
import { SampleSection } from "@/app/components/landing/SampleSection";
import { HomeHero } from "@/app/components/landing/HomeHero";
import { useLocale } from "@/app/components/LocaleProvider";
import { BUSINESS } from "@/lib/business";

// Hero → Destinations → Invite → How it works → What you receive → FAQ.
// The old stats strip, Services section and Pricing tiers were removed —
// they repeated the same message without answering the visitor's first
// question. Each section here answers a different one.
export default function Home() {
  return (
    <div className="relative text-slate-900">
      <AuroraBackdrop />
      <Nav overDark />
      <HomeHero />
      <CountriesSection />
      <InviteSection />
      <HowItWorks />
      <SampleSection />
      <FaqSection />
      <Footer />
    </div>
  );
}

// Social links shown in the footer. Brand glyphs are inline SVG (24×24) so
// there's no icon dependency and nothing to load at runtime.
// The WhatsApp link uses wa.me with the number in international format and no
// "+" or spaces — that's the format WhatsApp resolves; it opens a chat with
// us directly.
const SOCIALS: { label: string; href: string; path: string }[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/vitamintravel_kr",
    path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z",
  },
  {
    label: "Telegram",
    href: "https://t.me/rich_visa",
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/821033964499",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  },
];

function SocialLinks() {
  return (
    <div className="flex items-center justify-center gap-4">
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-all hover:-translate-y-0.5 hover:border-cyan-400/50 hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}

function Footer() {
  const { t } = useLocale();
  const waHref = BUSINESS.whatsapp;
  const tgHref = BUSINESS.telegram;
  const colTitle = "text-xs font-bold uppercase tracking-widest text-slate-400";
  const link = "transition-colors hover:text-cyan-300";
  return (
    <footer className="relative overflow-hidden bg-slate-950 px-6 pb-10 pt-16 text-sm text-slate-300">
      {/* The same night sky the journey started under. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-orb absolute -left-24 bottom-0 h-72 w-72 [--orb-c:rgba(37,99,235,0.2)]" />
        <div className="glow-orb absolute -right-24 top-0 h-72 w-72 [--orb-c:rgba(6,182,212,0.14)]" />
        <svg className="absolute inset-x-0 top-0 h-10 w-full" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none">
          <path
            className="route-flow"
            d="M0 20C360 34 1080 6 1440 20"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="5 9"
          />
        </svg>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 260" fill="none" preserveAspectRatio="xMidYMid slice">
          {([[140, 90, 1.4, "0s"], [420, 60, 1.1, "-1.3s"], [760, 100, 1.5, "-2.4s"], [1050, 55, 1.1, "-0.7s"], [1310, 95, 1.4, "-1.8s"]] as const).map(
            ([x, y, r, delay]) => (
              <circle key={x} className="auth-star" cx={x} cy={y} r={r} fill="#E0F2FE" style={{ animationDelay: delay }} />
            )
          )}
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Company */}
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              VisaAI <span className="text-cyan-300">Korea</span>
            </span>
            <p className="mt-3 max-w-xs leading-relaxed text-slate-400">
              {t("footer.operatedBy")} <span className="font-semibold text-slate-200">{BUSINESS.legalName}</span>
            </p>
            <address className="mt-3 max-w-xs not-italic leading-relaxed text-slate-400">
              {BUSINESS.address}
            </address>
            {BUSINESS.registrationNumber && (
              <p className="mt-2 text-slate-400">
                {t("footer.registration")}: <span className="text-slate-200">{BUSINESS.registrationNumber}</span>
              </p>
            )}
            <div className="mt-5">
              <SocialLinks />
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className={colTitle}>{t("footer.explore")}</p>
            <ul className="mt-4 space-y-2.5 font-medium">
              <li><Link href="/services" className={link}>{t("footer.services")}</Link></li>
              <li><Link href="/destinations" className={link}>{t("nav.destinations")}</Link></li>
              <li><Link href="/flights" className={link}>{t("nav.flights")}</Link></li>
              <li><Link href="/tours" className={link}>{t("nav.tours")}</Link></li>
              <li><Link href="/invite" className={link}>{t("nav.invite")}</Link></li>
              <li><a href="#faq" className={link}>{t("footer.faq")}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className={colTitle}>{t("footer.legal")}</p>
            <ul className="mt-4 space-y-2.5 font-medium">
              <li><Link href="/privacy" className={link}>{t("footer.privacy")}</Link></li>
              <li><Link href="/terms" className={link}>{t("footer.terms")}</Link></li>
              <li><Link href="/refunds" className={link}>{t("footer.refunds")}</Link></li>
              <li><Link href="/login" className={link}>{t("nav.signIn")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className={colTitle}>{t("footer.contact")}</p>
            <ul className="mt-4 space-y-2.5 font-medium">
              <li>
                <a href={`mailto:${BUSINESS.email}`} className={`${link} break-all`}>{BUSINESS.email}</a>
              </li>
              <li>
                <a href={`tel:${BUSINESS.phones.korea.replace(/\s/g, "")}`} className={link}>
                  🇰🇷 {BUSINESS.phones.korea}
                </a>
              </li>
              <li>
                <a href={`tel:${BUSINESS.phones.uzbekistan.replace(/\s/g, "")}`} className={link}>
                  🇺🇿 {BUSINESS.phones.uzbekistan}
                </a>
              </li>
              <li className="flex gap-3 pt-1">
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-400/20">WhatsApp</a>
                <a href={tgHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-400/20">Telegram</a>
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">{t("footer.replyTime")}</p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-slate-500">
            {t("footer.disclaimer")}
          </p>
          <p className="mt-4 text-center text-xs text-slate-500">
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
