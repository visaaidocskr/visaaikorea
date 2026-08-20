"use client";

import { useLocale } from "@/app/components/LocaleProvider";

// Once a destination is chosen, the whole application takes on that
// country's air: a flag banner above the steps, tinted glow in the page
// background, and a faint landmark on the horizon. Same discipline as the
// rest of the site — gradients for softness, no filters, nothing animated
// beyond the orbs' existing slow pulse.

type Theme = {
  flag: string;
  nameKey: string;
  orbA: string;
  orbB: string;
  banner: string;
  silhouette: string;
  landmark: React.ReactNode;
};

const THEMES: Record<string, Theme> = {
  Japan: {
    flag: "🇯🇵",
    nameKey: "auth.scene.japan",
    orbA: "rgba(244,63,94,0.16)",
    orbB: "rgba(251,113,133,0.12)",
    banner: "border-rose-200 bg-rose-50 text-rose-800",
    silhouette: "text-rose-900",
    landmark: (
      <>
        {/* Mt. Fuji with a rising sun */}
        <circle cx="330" cy="64" r="30" />
        <path d="M0 260L118 96C136 72 158 72 176 96L330 260Z" />
        <path d="M118 96C136 72 158 72 176 96L186 110C162 126 128 126 106 110Z" fill="#fff" fillOpacity=".5" />
      </>
    ),
  },
  Taiwan: {
    flag: "🇹🇼",
    nameKey: "auth.scene.taiwan",
    orbA: "rgba(37,99,235,0.15)",
    orbB: "rgba(225,29,72,0.1)",
    banner: "border-blue-200 bg-blue-50 text-blue-800",
    silhouette: "text-blue-900",
    landmark: (
      <>
        {/* Taipei 101 */}
        <path d="M196 26H204L208 44H192Z" />
        <path d="M199 8H201V28H199Z" />
        <path d="M188 44H212L218 74H182Z" />
        <path d="M185 74H215L221 104H179Z" />
        <path d="M182 104H218L224 134H176Z" />
        <path d="M180 134H220L226 164H174Z" />
        <path d="M178 164H222L228 194H172Z" />
        <path d="M176 194H224L230 224H170Z" />
        <path d="M168 224H232V260H168Z" />
      </>
    ),
  },
  Singapore: {
    flag: "🇸🇬",
    nameKey: "auth.scene.singaporeCountry",
    orbA: "rgba(13,148,136,0.15)",
    orbB: "rgba(225,29,72,0.09)",
    banner: "border-teal-200 bg-teal-50 text-teal-800",
    silhouette: "text-teal-900",
    landmark: (
      <>
        {/* Marina Bay Sands */}
        <path d="M118 260L130 120H152L156 260Z" />
        <path d="M188 260L196 120H218L222 260Z" />
        <path d="M258 260L262 120H284L292 260Z" />
        <path d="M84 118C160 88 260 88 322 106L326 92C256 70 152 72 82 104Z" />
      </>
    ),
  },
  Spain: {
    flag: "🇪🇸",
    nameKey: "auth.scene.spain",
    orbA: "rgba(245,158,11,0.16)",
    orbB: "rgba(220,38,38,0.1)",
    banner: "border-amber-200 bg-amber-50 text-amber-900",
    silhouette: "text-amber-900",
    landmark: (
      <>
        {/* Sagrada Família spires */}
        <path d="M130 260V120C130 92 150 92 150 120V260Z" />
        <path d="M139 96V78" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M180 260V84C180 52 204 52 204 84V260Z" />
        <path d="M191 58V38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M234 260V110C234 84 254 84 254 110V260Z" />
        <path d="M243 88V70" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M104 260V168C104 148 120 148 120 168V260Z" />
        <path d="M264 260V160C264 140 280 140 280 160V260Z" />
      </>
    ),
  },
  Vietnam: {
    flag: "🇻🇳",
    nameKey: "auth.scene.vietnam",
    orbA: "rgba(220,38,38,0.13)",
    orbB: "rgba(250,204,21,0.14)",
    banner: "border-red-200 bg-red-50 text-red-800",
    silhouette: "text-red-900",
    landmark: (
      <>
        {/* Hạ Long Bay karsts and a junk boat */}
        <path d="M60 260V170C60 130 96 118 108 150C120 118 150 128 150 168V260Z" />
        <path d="M190 260V190C190 158 220 148 230 174C240 150 264 158 264 192V260Z" />
        <path d="M300 260V208C300 184 324 178 330 198C338 180 356 186 356 210V260Z" />
        <path d="M120 244H190L180 260H130Z" />
        <path d="M152 240C168 218 168 196 156 180C180 194 184 224 170 240Z" />
      </>
    ),
  },
};

/** Fixed page-background tint + landmark for the chosen destination. */
export function CountryAmbience({ destination }: { destination: string }) {
  const theme = THEMES[destination];
  if (!theme) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="glow-orb absolute -left-28 top-24 h-96 w-96"
        style={{ "--orb-c": theme.orbA } as React.CSSProperties}
      />
      <div
        className="glow-orb absolute -right-28 bottom-16 h-[26rem] w-[26rem]"
        style={{ "--orb-c": theme.orbB } as React.CSSProperties}
      />
      <div className={`absolute -bottom-4 -right-4 w-[30rem] max-w-[75vw] opacity-[.07] ${theme.silhouette}`}>
        <svg viewBox="0 0 400 260" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          {theme.landmark}
        </svg>
      </div>
    </div>
  );
}

/** Flag chip above the wizard steps: "You're in the Japan visa panel". */
export function CountryBanner({ destination }: { destination: string }) {
  const { t } = useLocale();
  const theme = THEMES[destination];
  if (!theme) return null;
  return (
    <div className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 ${theme.banner}`}>
      <span aria-hidden className="text-3xl leading-none">{theme.flag}</span>
      <p className="text-sm font-bold">
        {t("apply.countryPanel").replace("{country}", t(theme.nameKey))}
      </p>
    </div>
  );
}
