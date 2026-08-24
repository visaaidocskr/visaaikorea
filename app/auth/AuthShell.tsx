import Link from "next/link";
import { TravelAuthScene } from "@/app/auth/TravelAuthScene";
import { LanguageSelector } from "@/app/components/LanguageSelector";

// Shared visual wrapper for the auth pages (server component).
//
// On large screens the sign-in card doesn't just appear: the mascot pushes it
// in from the right edge of the screen, the card settles with a little
// overshoot, and he stays leaning against it. Pure CSS on two SVG poses —
// phones and reduced-motion visitors get the ordinary static card.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-8 text-slate-900 sm:px-6 sm:py-14">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSelector compact />
      </div>
      <div className="glow-orb absolute -left-40 top-0 h-96 w-96 [--orb-c:rgba(219,234,254,0.8)]" />
      <div className="glow-orb absolute -right-40 bottom-0 h-96 w-96 [--orb-c:rgba(207,250,254,0.7)]" />
      <div className="relative grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <TravelAuthScene />

        <div className="w-full max-w-md justify-self-center">
          <Link href="/" className="mb-7 block text-center text-2xl font-extrabold tracking-tight text-blue-700">
            VisaAI Korea
          </Link>
          <div className="auth-form-arrival relative">
            <div className="relative z-10 rounded-[2rem] border border-white/80 bg-white p-8 shadow-2xl shadow-slate-300/60 md:p-10">
              <h1 className="text-3xl font-extrabold">{title}</h1>
              <p className="mt-2 mb-8 text-slate-600">{subtitle}</p>
              {children}
            </div>
            <CardPusher />
          </div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </div>
    </main>
  );
}

// The mascot from the travel scene, in two poses: straining against the card
// while it slides, then leaning on it once it lands. The pose swap and all
// motion live in globals.css, keyed to the card's arrival timeline.
function CardPusher() {
  return (
    <div aria-hidden="true" className="auth-pusher absolute -right-16 bottom-3 z-20 w-20">
      <svg viewBox="0 0 80 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="44" cy="126" rx="27" ry="4" fill="#0F172A" opacity=".12" />

        {/* Pose 1: pushing — leaning hard to the left, feet scrabbling. */}
        <g className="auth-pusher-push">
          {/* legs driving backward */}
          <path className="auth-push-leg-a" d="M50 86L64 104L71 120" stroke="#172554" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path className="auth-push-leg-b" d="M45 88L44 106L52 120" stroke="#1E3A8A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M68 123H79" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 123H61" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
          {/* torso leaning into the card */}
          <path d="M31 47C39 41 52 46 54 56L56 86C48 94 34 92 29 82L26 57C26 51 28 49 31 47Z" fill="#2563EB" />
          <path d="M40 52L44 82" stroke="#93C5FD" strokeWidth="2" />
          {/* backpack on his back (right side, away from the card) */}
          <path d="M54 56C63 60 64 76 56 82L51 78L52 60L54 56Z" fill="#0F3C78" />
          {/* both arms braced against the card edge */}
          <path d="M33 55L13 60" stroke="#2563EB" strokeWidth="9" strokeLinecap="round" />
          <path d="M36 69L15 73" stroke="#2563EB" strokeWidth="9" strokeLinecap="round" />
          <circle cx="11" cy="60" r="4.5" fill="#D6A879" />
          <circle cx="13" cy="74" r="4.5" fill="#D6A879" />
          {/* head down, digging in */}
          <circle cx="34" cy="34" r="12" fill="#D6A879" />
          <path d="M23 33C23 24 31 19 39 22C45 24 48 30 46 38C41 33 36 31 29 32L26 40C24 38 23 36 23 33Z" fill="#0F172A" />
        </g>

        {/* Pose 2: back against the delivered card, ankles crossed, done. */}
        <g className="auth-pusher-lean" opacity="0">
          <g transform="rotate(-12 24 124)">
            {/* weight leg, and the other ankle crossed over it */}
            <path d="M32 86L34 104L33 119" stroke="#172554" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M38 86L35 102L50 115" stroke="#1E3A8A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M27 122H39" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M47 118H59" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            {/* torso, back to the card */}
            <path d="M24 48C30 42 44 44 46 52L48 84C41 91 28 91 24 83L22 56C22 51 22 50 24 48Z" fill="#2563EB" />
            <path d="M36 50L38 80" stroke="#93C5FD" strokeWidth="2" />
            {/* slim backpack squeezed against the card */}
            <path d="M24 54C15 58 14 74 22 80L26 76L26 58L24 54Z" fill="#0F3C78" />
            {/* one arm folded across, the other hanging easy */}
            <path d="M45 60C38 68 31 68 26 63" stroke="#2563EB" strokeWidth="9" strokeLinecap="round" />
            <circle cx="26" cy="63" r="4.5" fill="#D6A879" />
            <path d="M46 56C50 66 49 74 44 79" stroke="#2563EB" strokeWidth="9" strokeLinecap="round" />
            <circle cx="43" cy="80" r="4.5" fill="#D6A879" />
            {/* head up, facing away from the card */}
            <circle cx="36" cy="32" r="12" fill="#D6A879" />
            <path d="M25 30C24 21 33 16 41 19C47 21 50 27 48 34C44 28 38 27 33 29L28 38C26 36 25 33 25 30Z" fill="#0F172A" />
          </g>
        </g>
      </svg>
    </div>
  );
}
