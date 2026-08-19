"use client";

// Decorative, deliberately lightweight SVG scene for the sign-in experience.
// It uses no images, canvas, or JS timers, keeping the auth page fast even on
// a phone. The whole scene is hidden from assistive technology because the
// login form already supplies all meaningful information.
//
// The plane and its comet trail follow the drawn route exactly via CSS
// offset-path (with the old keyframe flight kept as a fallback), so the
// flight, the dashed line and the destination ping all tell one story.
import { useLocale } from "@/app/components/LocaleProvider";

// One route string shared by the dashed line and (in CSS) the flight path.
export const AUTH_ROUTE = "M73 261C153 267 158 158 252 179C331 198 326 72 433 71";

// x, y, radius, animation delay — a sparse night sky, brighter near the top.
const STARS: Array<[number, number, number, string]> = [
  [46, 38, 1.6, "0s"],
  [120, 22, 1.2, "-1.1s"],
  [187, 54, 1.5, "-2.3s"],
  [262, 30, 1.1, "-0.6s"],
  [318, 58, 1.4, "-1.8s"],
  [391, 24, 1.2, "-2.9s"],
  [465, 52, 1.6, "-0.3s"],
  [225, 96, 1.0, "-1.5s"],
];

// Lit windows inside the skyline silhouettes; each blinks on its own clock.
const WINDOWS: Array<[number, number, string]> = [
  [44, 262, "0s"],
  [53, 274, "-2.1s"],
  [44, 286, "-3.7s"],
  [71, 284, "-1.3s"],
  [79, 292, "-4.9s"],
  [430, 252, "-2.8s"],
  [439, 264, "-0.7s"],
  [445, 278, "-4.2s"],
  [404, 274, "-3.1s"],
  [412, 288, "-1.9s"],
];

export function TravelAuthScene() {
  const { t } = useLocale();
  return (
    <div
      aria-hidden="true"
      className="auth-scene relative isolate min-h-56 overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 px-6 py-7 shadow-2xl shadow-blue-950/25 sm:min-h-72 md:min-h-[35rem] md:px-10 md:py-10"
    >
      <div className="auth-scene-orb absolute -left-16 -top-16 h-52 w-52 rounded-full bg-blue-500/35 blur-3xl" />
      <div className="auth-scene-orb-delay absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="auth-aurora pointer-events-none absolute left-1/2 top-1/2 h-[170%] w-[170%]" />

      <div className="auth-enter relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
        <span className="auth-beacon h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_3px_rgba(103,232,249,0.55)]" />
        {t("auth.journey")}
      </div>

      <div className="auth-enter relative z-10 mt-3 max-w-xs" style={{ animationDelay: "120ms" }}>
        <p className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {t("auth.destination")}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("auth.calm")}
        </p>
      </div>

      <svg
        viewBox="0 0 500 330"
        className="auth-enter absolute inset-x-0 bottom-0 z-10 h-[72%] w-full md:h-[66%]"
        style={{ animationDelay: "260ms" }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="travel-route" x1="86" y1="253" x2="409" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#67E8F9" />
            <stop offset="1" stopColor="#818CF8" />
          </linearGradient>
          <filter id="travel-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
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

        <path
          className="auth-route-halo"
          d={AUTH_ROUTE}
          stroke="#60A5FA"
          strokeOpacity=".2"
          strokeWidth="30"
        />
        <path
          className="auth-route"
          d={AUTH_ROUTE}
          stroke="url(#travel-route)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="5 10"
        />

        {/* Destination ping: the route visibly ends somewhere worth going. */}
        <g transform="translate(433 71)">
          <circle className="auth-dest-ring" r="7" stroke="#67E8F9" strokeWidth="1.5" />
          <circle className="auth-dest-ring-delay" r="7" stroke="#818CF8" strokeWidth="1.5" />
          <circle r="3.5" fill="#67E8F9" filter="url(#travel-glow)" />
        </g>

        <g className="auth-cloud" opacity=".8">
          <path d="M39 126C39 116 47 108 57 108C60 96 70 88 83 88C99 88 112 101 112 117H39C39 117 39 117 39 126Z" fill="white" fillOpacity=".12" />
        </g>
        <g className="auth-cloud-slow" opacity=".8">
          <path d="M354 215C354 206 361 199 370 199C374 188 384 181 396 181C412 181 424 194 424 210H354V215Z" fill="white" fillOpacity=".1" />
        </g>

        {/* A small original traveler scene: passport, luggage, walking motion
            and a boarding pass make this feel like a journey, not a dashboard. */}
        <g opacity=".28">
          <path d="M13 304H487" stroke="#BFDBFE" strokeWidth="1" />
          <path d="M18 303V272H35V303M39 303V255H62V303M67 303V279H87V303M398 303V266H420V303M425 303V246H453V303M459 303V276H480V303" fill="#1E3A8A" />
          <path d="M42 252L51 240L60 252M428 244L439 230L450 244" stroke="#93C5FD" strokeWidth="2" />
        </g>
        <g>
          {WINDOWS.map(([x, y, delay]) => (
            <rect
              key={`${x}-${y}`}
              className="auth-window"
              x={x}
              y={y}
              width="3.5"
              height="5"
              rx="0.75"
              fill="#FDE68A"
              style={{ animationDelay: delay }}
            />
          ))}
        </g>

        <g className="auth-ticket" transform="translate(312 119)">
          <rect width="82" height="38" rx="8" fill="#F8FAFC" fillOpacity=".96" />
          <path d="M11 13H45M11 19H33M11 25H51" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <path d="M62 9V29" stroke="#BFDBFE" strokeWidth="2" strokeDasharray="2 3" />
          <path d="M68 13L78 18L68 23V19H61V17H68V13Z" fill="#2563EB" />
        </g>

        {/* Grounding shadow, pulsing in step with the walk cycle. */}
        <ellipse
          className="auth-traveler-shadow"
          cx="247"
          cy="321"
          rx="55"
          ry="6.5"
          fill="#020617"
          opacity=".38"
        />

        <g className="auth-traveler" transform="translate(205 190)">
          {/* suitcase */}
          <g className="auth-suitcase" transform="translate(57 58)">
            <rect x="0" y="0" width="34" height="43" rx="6" fill="#F59E0B" />
            <rect x="5" y="6" width="24" height="5" rx="2.5" fill="#FDE68A" />
            <path d="M9 0V-10C9-14 25-14 25-10V0" stroke="#FDE68A" strokeWidth="3" />
            <circle cx="8" cy="45" r="3" fill="#0F172A" />
            <circle cx="26" cy="45" r="3" fill="#0F172A" />
          </g>
          {/* legs */}
          <path className="auth-walk-leg-left" d="M29 76L19 116L9 141" stroke="#172554" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
          <path className="auth-walk-leg-right" d="M40 76L48 113L66 137" stroke="#1E3A8A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 143H24M62 139H79" stroke="#F8FAFC" strokeWidth="8" strokeLinecap="round" />
          {/* coat / torso */}
          <path d="M19 39C21 30 50 30 54 42L58 78C49 88 25 88 14 76L19 39Z" fill="#2563EB" />
          <path d="M35 40V75" stroke="#93C5FD" strokeWidth="2" />
          <path d="M25 42L35 52L46 42" stroke="#DBEAFE" strokeWidth="2.5" strokeLinecap="round" />
          {/* backpack */}
          <path d="M15 44C4 47 3 70 13 75L19 70L18 48L15 44Z" fill="#0F3C78" />
          {/* arms */}
          <path className="auth-walk-arm-left" d="M20 47L3 76L-4 93" stroke="#2563EB" strokeWidth="11" strokeLinecap="round" />
          <path className="auth-walk-arm-right" d="M51 48L66 73L71 86" stroke="#2563EB" strokeWidth="11" strokeLinecap="round" />
          <circle cx="-5" cy="94" r="5" fill="#D6A879" />
          <circle cx="72" cy="87" r="5" fill="#D6A879" />
          {/* head / hair */}
          <circle cx="36" cy="20" r="15" fill="#D6A879" />
          <path d="M22 19C22 7 32 3 42 6C50 8 53 15 50 25C45 19 39 17 31 18L26 28C22 25 21 22 22 19Z" fill="#0F172A" />
          {/* passport in hand */}
          <g transform="translate(64 82) rotate(-12)">
            <rect width="14" height="19" rx="2" fill="#06B6D4" />
            <circle cx="7" cy="7" r="3" stroke="#CFFAFE" strokeWidth="1" />
            <path d="M3 13H11" stroke="#CFFAFE" strokeWidth="1" />
          </g>
        </g>

        <g transform="translate(55 239)">
          <circle className="auth-pin-ring" cx="18" cy="18" r="18" stroke="#67E8F9" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="18" fill="#0F172A" stroke="#67E8F9" strokeWidth="2" />
          <path d="M18 8C14 8 11 11 11 15C11 21 18 27 18 27C18 27 25 21 25 15C25 11 22 8 18 8ZM18 18C16 18 15 17 15 15C15 13 16 12 18 12C20 12 21 13 21 15C21 17 20 18 18 18Z" fill="#CFFAFE" />
          <text x="43" y="14" fill="#E0F2FE" fontSize="12" fontWeight="700">{t("auth.scene.seoul")}</text>
          <text x="43" y="31" fill="#94A3B8" fontSize="10">{t("auth.scene.korea")}</text>
        </g>

        <g className="auth-chip" transform="translate(385 46)">
          <rect width="84" height="48" rx="12" fill="#FFFFFF" fillOpacity=".12" stroke="#FFFFFF" strokeOpacity=".22" />
          <text x="13" y="21" fill="white" fontSize="11" fontWeight="700">{t("auth.scene.trip")}</text>
          <text x="13" y="36" fill="#BFDBFE" fontSize="10">{t("auth.scene.destinations")}</text>
        </g>

        {/* Comet trail: only shown when CSS motion paths are supported. */}
        <circle className="auth-comet" r="3.5" fill="#A5F3FC" filter="url(#travel-glow)" />

        <g className="auth-plane" filter="url(#travel-glow)">
          <path d="M-12 0L10 -6L23 -2L10 3L1 11H-5L-2 3L-12 0Z" fill="#F8FAFC" />
          <path d="M-12 0L10 -6L23 -2L10 3" stroke="#93C5FD" strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      </svg>

      <div
        className="auth-enter absolute bottom-5 right-6 z-20 hidden rounded-2xl sm:block border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md md:bottom-9 md:right-9"
        style={{ animationDelay: "460ms" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">VisaAI Korea</p>
        <p className="mt-0.5 text-xs font-semibold text-white">{t("auth.scene.prepared")}</p>
      </div>
    </div>
  );
}
