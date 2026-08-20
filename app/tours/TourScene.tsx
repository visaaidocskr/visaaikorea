"use client";

import { useLocale } from "@/app/components/LocaleProvider";

// Golden-hour panel for the tours page: the same lightweight rules as the
// rest of the brand — softness lives in gradients, motion in transforms,
// no filters, no timers. A balloon drifts over silhouetted landmarks while
// the visitor plans the trip on the right.
export function TourScene() {
  const { t } = useLocale();
  return (
    <section className="lg:sticky lg:top-24">
      <div
        className="relative isolate overflow-hidden rounded-[2rem] border border-orange-200/40 p-8 shadow-2xl shadow-orange-200/40 md:p-10"
        style={{
          background:
            "linear-gradient(180deg, #1E1B4B 0%, #4C1D95 32%, #BE185D 58%, #F97316 80%, #FDE68A 100%)",
        }}
      >
        {/* Sky scene */}
        <svg
          aria-hidden="true"
          viewBox="0 0 500 340"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <radialGradient id="tour-sun-grad">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="35%" stopColor="#FDE68A" stopOpacity=".95" />
              <stop offset="70%" stopColor="#FB923C" stopOpacity=".55" />
              <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Setting sun */}
          <circle className="tour-sun" cx="128" cy="252" r="78" fill="url(#tour-sun-grad)" />

          {/* Drifting clouds */}
          <g className="tour-cloud-a" opacity=".75">
            <path d="M52 166C52 158 59 152 67 152C70 142 79 136 90 136C104 136 115 147 115 161H52C52 161 52 161 52 166Z" fill="#FFF7ED" fillOpacity=".28" />
          </g>
          <g className="tour-cloud-b" opacity=".7">
            <path d="M300 190C300 183 306 178 313 178C316 169 324 163 334 163C347 163 357 173 357 186H300V190Z" fill="#FFE4E6" fillOpacity=".24" />
          </g>

          {/* Gliding gulls */}
          <g className="tour-bird" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round">
            <path d="M40 186C44 182 48 182 51 186C54 182 58 182 62 186" />
          </g>
          <g className="tour-bird" style={{ animationDelay: "-8s" }} stroke="#312E81" strokeWidth="2" strokeLinecap="round">
            <path d="M20 214C23 211 26 211 29 214C32 211 35 211 38 214" />
          </g>

          {/* Hot-air balloon */}
          <g transform="translate(368 100)">
            <g className="tour-balloon">
            <path d="M32 0C14 0 0 15 0 34C0 53 17 66 25 77H39C47 66 64 53 64 34C64 15 50 0 32 0Z" fill="#F59E0B" />
            <path d="M32 0C24 15 24 62 32 77" stroke="#FDE68A" strokeWidth="3" />
            <path d="M32 0C40 15 40 62 32 77" stroke="#FB7185" strokeWidth="3" />
            <path d="M32 0C14 0 0 15 0 34C0 53 17 66 25 77H32C26 66 12 53 12 34C12 15 22 0 32 0Z" fill="#EA580C" opacity=".45" />
            <path d="M25 77L27 90M39 77L37 90" stroke="#7C2D12" strokeWidth="2" />
            <rect x="25" y="90" width="14" height="11" rx="2.5" fill="#92400E" />
            </g>
          </g>

          {/* Faraway hills */}
          <path d="M0 306L64 258L128 306L196 252L262 306H0Z" fill="#312E81" opacity=".45" />
          <path d="M238 306L306 246L376 306L432 262L500 306H238Z" fill="#312E81" opacity=".4" />

          {/* Landmark silhouettes on the horizon */}
          <g fill="#1E1B4B" stroke="#1E1B4B" opacity=".92">
            {/* torii gate */}
            <path d="M56 306V262M92 306V262" strokeWidth="7" strokeLinecap="round" />
            <path d="M44 260H104" strokeWidth="8" strokeLinecap="round" />
            <path d="M52 274H96" strokeWidth="4" strokeLinecap="round" />
            {/* observation tower */}
            <path d="M236 306L246 224H258L268 306Z" strokeWidth="0" />
            <path d="M252 224V196" strokeWidth="4" strokeLinecap="round" />
            <circle cx="252" cy="218" r="12" strokeWidth="0" />
            {/* pagoda */}
            <path d="M330 306V252M362 306V252" strokeWidth="5" />
            <path d="M318 252C330 244 362 244 374 252L346 236L318 252Z" strokeWidth="0" />
            <path d="M322 276H370" strokeWidth="5" strokeLinecap="round" />
            {/* palm */}
            <path d="M438 306C440 288 438 272 432 260" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M432 260C424 252 412 250 402 254M432 260C430 248 434 238 444 232M432 260C440 250 452 246 462 250" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>

          {/* Ground */}
          <path d="M0 340V304H500V340Z" fill="#1E1B4B" opacity=".9" />
        </svg>

        {/* Copy — kept in the darker top half of the sky for contrast. */}
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-300">
            <span aria-hidden className="sparkle">✦</span>
            {t("tour.eyebrow")}
          </p>
          <h1 className="text-sunset-gradient mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("tour.title")}
          </h1>
          <p className="mt-5 max-w-md pb-64 text-lg leading-relaxed text-orange-50/95 sm:pb-72">
            {t("tour.description")}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
        <strong>{t("tour.honest")}</strong> {t("tour.honestText")}
      </div>
    </section>
  );
}
