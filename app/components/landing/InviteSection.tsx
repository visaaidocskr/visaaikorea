import Link from "next/link";
import { Reveal } from "@/app/components/Reveal";
import { useLocale } from "@/app/components/LocaleProvider";

// Deliberately its own section rather than a fifth card in the destinations
// grid: those are places you travel to, this is someone travelling to you.
// Mixing the two under "Choose where you're going" would put a visa category
// in a row of countries.
export function InviteSection() {
  const { t } = useLocale();
  return (
    <section id="invite" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            {t("invite.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("invite.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("invite.description")}
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/5 px-8 py-7">
              <div className="flex items-center gap-3 text-4xl">
                <span aria-hidden>🇺🇿</span>
                <span aria-hidden className="text-2xl text-slate-400">
                  →
                </span>
                <span aria-hidden>🇰🇷</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">
                {t("invite.cardTitle")}
              </h3>
              <p className="mt-1 font-medium text-slate-600">
                {t("invite.cardSubtitle")}
              </p>
              <div className="mt-4 inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-bold text-blue-800">
                {t("invite.price")}
              </div>
            </div>

            <div className="space-y-6 p-8">
              <p className="text-sm leading-relaxed text-slate-600">
                {t("invite.explainer")}
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("invite.writes")}
                </h4>
                <ul className="mt-3 space-y-2">
                  {[
                    t("invite.invitation"), t("invite.reason"), t("invite.guarantee"),
                  ].map((d) => (
                    <li key={d} className="flex gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 text-blue-600">✓</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="rounded-2xl bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-500">
                {t("invite.notice")}
              </p>

              <p className="text-xs leading-relaxed text-slate-500">
                {t("invite.fee")}
              </p>

              <Link
                href="/invite"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {t("invite.start")} <span aria-hidden>→</span>
              </Link>

              <p className="text-center text-xs text-slate-400">
                {t("invite.availability")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
