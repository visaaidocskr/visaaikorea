import Link from "next/link";
import { Reveal } from "@/app/components/Reveal";

// Deliberately its own section rather than a fifth card in the destinations
// grid: those are places you travel to, this is someone travelling to you.
// Mixing the two under "Choose where you're going" would put a visa category
// in a row of countries.
export function InviteSection() {
  return (
    <section id="invite" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Inviting family
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Bring your family to Korea
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            If you live in Korea and want a parent or relative to visit, the
            invitation paperwork has to come from you. We write it.
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
                Invite your family to Korea
              </h3>
              <p className="mt-1 font-medium text-slate-600">
                Short-term visit · C-3-1
              </p>
            </div>

            <div className="space-y-6 p-8">
              <p className="text-sm leading-relaxed text-slate-600">
                Your relative applies for the visa at the Korean embassy in
                Uzbekistan. What they cannot get there is the paperwork that has
                to be written by you, in Korea — and that is what this does.
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  We write, for each person you invite
                </h4>
                <ul className="mt-3 space-y-2">
                  {[
                    "초청장 — the invitation letter",
                    "초청 사유서 — your statement of reasons",
                    "신원보증서 — the guarantee form (별지 제129호서식)",
                  ].map((d) => (
                    <li key={d} className="flex gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 text-blue-600">✓</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="rounded-2xl bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-500">
                Everything else — your enrolment certificate, bank statement,
                the papers from your 주민센터, and what your relative gathers in
                Uzbekistan — you collect yourself. We show you the exact list
                for your visa status before you start.
              </p>

              <Link
                href="/invite"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Prepare invitation documents <span aria-hidden>→</span>
              </Link>

              <p className="text-center text-xs text-slate-400">
                Currently for relatives applying in Uzbekistan.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
