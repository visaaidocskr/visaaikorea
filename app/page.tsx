import Link from "next/link";
import { Nav } from "@/app/components/landing/Nav";
import { CountriesSection } from "@/app/components/landing/CountriesSection";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";

// Deliberately kept to three sections: Hero → Destinations → How it works.
// The old stats strip, Services section, Pricing tiers and bottom CTA were
// removed — they repeated the same message, and the pricing tiers listed no
// actual prices, which raises the visitor's first question without answering
// it. Pricing returns once the destination list is final.
export default function Home() {
  return (
    <div className="relative bg-white text-slate-900">
      <Nav />
      <Hero />
      <CountriesSection />
      <HowItWorks />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50/40 px-6 pt-16 pb-24 sm:pt-24">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tourist visa documents for foreigners living in Korea
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-7xl">
            Your visa paperwork,
            <br />
            <span className="text-blue-700">done properly.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Answer a few questions about your trip. We prepare the complete
            document set the embassy expects — matched to your nationality and
            your Korean visa status, then checked by our team before you get it.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex justify-center">
            <GenerateButton size="lg" />
          </div>
        </Reveal>

        <Reveal delay={320}>
          <p className="mt-6 text-sm text-slate-400">
            Japan · Taiwan · Singapore · Spain — more coming soon
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            VisaAI <span className="text-blue-700">Korea</span>
          </span>
          <div className="flex gap-6 text-sm font-semibold text-slate-600">
            <a href="/privacy" className="hover:text-blue-600">Privacy</a>
            <a href="/terms" className="hover:text-blue-600">Terms</a>
            <Link href="/login" className="hover:text-blue-600">Sign in</Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-slate-400">
          Vitamin VisaAI prepares documents based on information provided by the
          client. Visa approval is decided only by the embassy/consulate/immigration
          authority. This service does not guarantee visa approval.
        </p>
        <p className="mt-4 text-center text-xs text-slate-400">
          © 2026 VisaAI Korea · Tourist visa document preparation
        </p>
      </div>
    </footer>
  );
}
