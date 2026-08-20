"use client";

import Link from "next/link";
import { useLocale } from "@/app/components/LocaleProvider";

// First-light panel for the flights page: dawn to the tours page's dusk.
// Same rules as every scene — softness in gradients, motion in transforms,
// position attributes kept outside animated groups.

// Runway edge lights, blinking on their own clocks (reuses the window blink).
const RUNWAY_LIGHTS: Array<[number, string]> = [
  [70, "0s"],
  [150, "-1.6s"],
  [230, "-3.4s"],
  [310, "-0.9s"],
  [390, "-2.5s"],
  [460, "-4.3s"],
];

export function FlightScene() {
  const { t } = useLocale();
  return (
    <section className="lg:sticky lg:top-24">
      <div
        className="relative isolate overflow-hidden rounded-[2rem] border border-sky-200/40 p-8 shadow-2xl shadow-sky-200/50 md:p-10"
        style={{
          background:
            "linear-gradient(180deg, #0F172A 0%, #1E3A8A 34%, #0284C7 62%, #7DD3FC 82%, #FEF3C7 100%)",
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 500 340"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <radialGradient id="dawn-sun-grad">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FDE68A" stopOpacity=".9" />
              <stop offset="75%" stopColor="#FCD34D" stopOpacity=".4" />
              <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* First light breaking at the horizon */}
          <circle className="tour-sun" cx="352" cy="296" r="82" fill="url(#dawn-sun-grad)" />

          {/* High morning clouds */}
          <g className="tour-cloud-a" opacity=".7">
            <path d="M64 158C64 150 71 144 79 144C82 134 91 128 102 128C116 128 127 139 127 153H64C64 153 64 153 64 158Z" fill="#E0F2FE" fillOpacity=".3" />
          </g>
          <g className="tour-cloud-b" opacity=".65">
            <path d="M318 120C318 113 324 108 331 108C334 99 342 93 352 93C365 93 375 103 375 116H318V120Z" fill="#BAE6FD" fillOpacity=".25" />
          </g>

          {/* Climb path the departures follow */}
          <path
            className="route-flow"
            d="M56 296C130 282 220 236 330 158C360 137 388 118 412 104"
            stroke="#BAE6FD"
            strokeOpacity=".55"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="5 10"
          />

          {/* A plane lifting off, again and again */}
          <g transform="translate(96 268)">
            <g className="flight-takeoff">
              <path d="M-22 0L18 -11L41 -3.5L18 5.5L2 20H-9L-3.5 5.5L-22 0Z" fill="#F8FAFC" />
              <path d="M-22 0L18 -11L41 -3.5L18 5.5" stroke="#BAE6FD" strokeWidth="1.6" strokeLinejoin="round" />
            </g>
          </g>

          {/* Airport silhouettes */}
          <g fill="#0F172A" opacity=".92">
            {/* control tower */}
            <path d="M418 306V246" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
            <path d="M400 246L436 246L430 222H406L400 246Z" />
            <path d="M418 222V210" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            {/* terminal building */}
            <path d="M26 306V280C26 272 34 266 44 266H120C130 266 138 272 138 280V306Z" />
            <path d="M148 306V286H196V306Z" />
            {/* radar dish */}
            <path d="M230 306V284" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
            <path d="M216 284C220 272 240 272 244 284L216 284Z" />
          </g>

          {/* Runway with blinking edge lights */}
          <path d="M0 340V306H500V340Z" fill="#0F172A" opacity=".92" />
          <path d="M20 322H480" stroke="#334155" strokeWidth="2" strokeDasharray="14 18" />
          {RUNWAY_LIGHTS.map(([x, delay]) => (
            <circle
              key={x}
              className="auth-window"
              cx={x}
              cy={311}
              r="3"
              fill="#FDE68A"
              style={{ animationDelay: delay }}
            />
          ))}
        </svg>

        {/* Copy — in the still-dark top of the dawn sky. */}
        <div className="relative z-10">
          <Link href="/services" className="text-sm font-semibold text-sky-200/90 transition-colors hover:text-white">
            ← {t("action.allServices")}
          </Link>
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sky-300">
            <span aria-hidden className="sparkle">✦</span>
            {t("flight.eyebrow")}
          </p>
          <h1 className="text-dawn-gradient mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("flight.title")}
          </h1>
          <p className="mt-5 max-w-md pb-64 text-lg leading-relaxed text-sky-50/95 sm:pb-72">
            {t("flight.description")}
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-4 rounded-2xl border border-sky-100 bg-white p-6 text-sm leading-relaxed text-slate-700">
        {["flight.one", "flight.two", "flight.three"].map((key, index) => (
          <li key={key} className="flex gap-3">
            <span className="font-bold text-sky-600">0{index + 1}</span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
