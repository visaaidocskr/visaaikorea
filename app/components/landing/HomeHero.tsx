"use client";

import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";
import { useLocale } from "@/app/components/LocaleProvider";

// Night-flight hero: the same sky the sign-in scene lives in — stars, a
// dashed route and a glowing plane crossing the headline. Pure CSS/SVG.
const STARS: Array<[number, number, number, string]> = [
  [90, 90, 1.8, "0s"], [210, 200, 1.2, "-1.4s"], [340, 70, 1.5, "-2.6s"],
  [520, 160, 1.2, "-.8s"], [660, 60, 1.8, "-1.9s"], [820, 210, 1.3, "-3.1s"],
  [980, 90, 1.6, "-.4s"], [1120, 180, 1.2, "-2.2s"], [1260, 60, 1.7, "-1.1s"],
  [1380, 170, 1.3, "-2.9s"], [430, 320, 1.1, "-1.6s"], [1180, 320, 1.2, "-.6s"],
];

const ROUTE = "M-40 300C240 330 420 130 700 190C980 250 1100 60 1520 80";

export function HomeHero() {
  const { t } = useLocale();
  const stops: Array<[string, string]> = [
    ["🇯🇵", t("auth.scene.japan")],
    ["🇹🇼", t("auth.scene.taiwan")],
    ["🇸🇬", t("auth.scene.singaporeCountry")],
    ["🇻🇳", t("auth.scene.vietnam")],
    ["🇪🇸", t("auth.scene.spain")],
  ];
  return (
    <section className="relative isolate -mt-[72px] overflow-hidden bg-slate-950 px-6 pb-20 pt-36 text-center sm:pt-44">
      {/* Sky backdrop: orbs, grid, stars, and the flight. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="auth-scene-orb glow-orb absolute -left-32 -top-32 h-[30rem] w-[30rem] [--orb-c:rgba(37,99,235,0.3)]" />
        <div className="auth-scene-orb-delay glow-orb absolute -right-32 top-1/4 h-[32rem] w-[32rem] [--orb-c:rgba(6,182,212,0.2)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_78%)]" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 560"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hero-route" x1="0" y1="300" x2="1440" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" stopOpacity=".7" />
              <stop offset="1" stopColor="#818CF8" stopOpacity=".7" />
            </linearGradient>
            <radialGradient id="hero-comet-glow">
              <stop offset="0%" stopColor="#E0FBFF" />
              <stop offset="45%" stopColor="#A5F3FC" stopOpacity=".8" />
              <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0" />
            </radialGradient>
          </defs>
          {STARS.map(([x, y, r, delay]) => (
            <circle
              key={`${x}-${y}`}
              className="auth-star"
              cx={x}
              cy={y}
              r={r}
              fill="#E0F2FE"
              style={{ animationDelay: delay }}
            />
          ))}
          <path d={ROUTE} stroke="#3B82F6" strokeOpacity=".12" strokeWidth="26" />
          <path
            className="route-flow"
            d={ROUTE}
            stroke="url(#hero-route)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 12"
          />
          <circle className="hero-comet" r="9" fill="url(#hero-comet-glow)" />
          <g className="hero-plane">
            <path d="M-16 0L13 -8L30 -2.5L13 4L1.5 14.5H-6.5L-2.5 4L-16 0Z" fill="#F8FAFC" />
            <path d="M-16 0L13 -8L30 -2.5L13 4" stroke="#93C5FD" strokeWidth="1.4" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Reveal immediate>
          <div className="ai-chip mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-cyan-100">
            <span aria-hidden className="sparkle text-cyan-300">✦</span>
            {t("hero.badge")}
          </div>
        </Reveal>
        <Reveal immediate delay={80}>
          <h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl">
            {t("hero.title1")}
            <br />
            <span className="text-sky-gradient">{t("hero.title2")}</span>
          </h1>
        </Reveal>
        <Reveal immediate delay={160}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            {t("hero.description")}
          </p>
        </Reveal>
        <Reveal immediate delay={200}>
          <p className="mt-4 text-sm font-medium text-slate-400">
            {t("hero.by")} <span className="font-semibold text-slate-200">Vitamin Travel</span>
          </p>
        </Reveal>
        <Reveal immediate delay={240}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <GenerateButton size="lg" className="btn-shine-auto" />
            <a
              href="#countries"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/15"
            >
              {t("nav.destinations")}
            </a>
          </div>
        </Reveal>
        <Reveal immediate delay={320}>
          <div className="mx-auto mt-9 flex max-w-2xl flex-wrap justify-center gap-3 text-sm">
            {[t("hero.prices"), t("hero.drafts"), t("hero.support")].map((line) => (
              <span
                key={line}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-slate-200"
              >
                <span className="text-emerald-400">✓</span>
                {line}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Destination marquee: where our clients are flying. */}
      <Reveal immediate delay={380}>
        <div className="marquee relative mx-auto mt-14 max-w-4xl" aria-hidden>
          <div className="marquee-track items-center gap-10 pr-10">
            {[...stops, ...stops].map(([flag, name], i) => (
              <span key={`${name}-${i}`} className="flex items-center gap-2.5 text-slate-300">
                <span className="text-2xl">{flag}</span>
                <span className="text-sm font-semibold tracking-wide">{name}</span>
                <span className="ml-6 text-slate-600">·</span>
              </span>
            ))}
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-500">{t("hero.destinations")}</p>
      </Reveal>
    </section>
  );
}
