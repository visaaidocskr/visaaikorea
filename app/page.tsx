"use client";

import { Nav } from "@/app/components/landing/Nav";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import { CountriesSection } from "@/app/components/landing/CountriesSection";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { FaqSection } from "@/app/components/landing/FaqSection";
import { SampleSection } from "@/app/components/landing/SampleSection";
import { TrustStrip } from "@/app/components/landing/TrustStrip";
import { WhySection } from "@/app/components/landing/WhySection";
import { MoreServices } from "@/app/components/landing/MoreServices";
import { Footer } from "@/app/components/landing/Footer";
import { HomeHero } from "@/app/components/landing/HomeHero";

// The conversion funnel, one question per section: Hero (what is this) →
// Trust (can I trust it) → Destinations (where) → How it works (what happens)
// → What you receive (what do I get) → Why VisaAI (why here) → secondary
// services → FAQ → a single closing CTA. The old full-width Invite section
// now lives inside MoreServices as a quiet product card.
export default function Home() {
  return (
    <div className="relative text-slate-900">
      <AuroraBackdrop />
      <Nav overDark />
      <HomeHero />
      <TrustStrip />
      <CountriesSection />
      <HowItWorks />
      <SampleSection />
      <WhySection />
      <MoreServices />
      <FaqSection />
      <Footer />
    </div>
  );
}
