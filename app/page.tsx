import Link from "next/link";
import { Nav } from "@/app/components/landing/Nav";
import { CountriesSection } from "@/app/components/landing/CountriesSection";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { ServicesSection } from "@/app/components/landing/ServicesSection";
import { Reveal } from "@/app/components/Reveal";
import { GenerateButton } from "@/app/components/GenerateButton";

export default function Home() {
  return (
    <div className="relative bg-white text-slate-900">
      <Nav />
      <Hero />
      <TrustStrip />
      <CountriesSection />
      <HowItWorks />
      <ServicesSection />
      <Pricing />
      <FinalCTA />
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
            AI visa documents for foreigners in Korea
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-7xl">
            Embassy-ready visa
            <br />
            documents in <span className="text-blue-700">minutes.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Choose your destination, answer a few questions, and let AI prepare
            your complete tourist-visa document package — tailored to your
            nationality and Korean visa status.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GenerateButton size="lg" />
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <p className="mt-6 text-sm text-slate-400">
            Japan · Spain · Taiwan · Singapore — more coming soon
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function TrustStrip() {
  const stats = [
    { value: "4", label: "Destinations supported" },
    { value: "23", label: "Korean visa statuses" },
    { value: "100%", label: "Private & secure storage" },
    { value: "Minutes", label: "From details to package" },
  ];
  return (
    <section className="border-y border-slate-100 bg-slate-50/60 px-6 py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 70} className="text-center">
            <p className="text-3xl font-bold tracking-tight text-slate-900">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Single",
      desc: "One destination, one trip.",
      features: ["1 destination package", "All required documents", "AI itinerary", "Email delivery"],
      featured: false,
    },
    {
      name: "Traveler",
      desc: "For regular travelers.",
      features: ["Multiple destinations", "Priority preparation", "Companion documents", "Reservation support"],
      featured: true,
    },
    {
      name: "Family",
      desc: "Apply together, save time.",
      features: ["Family applicant lists", "Shared financial proof", "All destinations", "Fastest turnaround"],
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="bg-slate-50/70 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, flexible plans
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Start with one trip — the flow is the same every time.
          </p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 90} className="h-full">
              <div
                className={`flex h-full flex-col rounded-2xl p-8 transition-shadow duration-200 ${
                  p.featured
                    ? "border-2 border-blue-700 bg-white shadow-md"
                    : "border border-slate-200 bg-white shadow-sm hover:shadow-md"
                }`}
              >
                {p.featured && (
                  <span className="mb-4 inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    Most popular
                  </span>
                )}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{p.desc}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 text-blue-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <GenerateButton full size="md" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-6 py-24">
      <Reveal className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl bg-blue-700 px-8 py-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready in minutes, not weeks.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Generate your complete embassy document package right now.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/apply?new=1"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
            >
              Generate Documents <span>→</span>
            </Link>
          </div>
        </div>
      </Reveal>
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
          © 2026 VisaAI Korea · AI-powered tourist visa document preparation
        </p>
      </div>
    </footer>
  );
}
