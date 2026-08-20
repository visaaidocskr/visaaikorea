import type { Metadata } from "next";
import { Nav } from "@/app/components/landing/Nav";
import { FlightSearchForm } from "@/app/flights/FlightSearchForm";
import { FlightScene } from "@/app/flights/FlightScene";

export const metadata: Metadata = { title: "Flight quotation · VisaAI Korea" };

export default function FlightsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50/80 via-blue-50/50 to-amber-50/50 text-slate-900">
      {/* First-light wash behind the whole page */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-orb absolute -left-32 top-28 h-96 w-96 [--orb-c:rgba(125,211,252,0.35)]" />
        <div className="glow-orb absolute -right-32 top-1/2 h-[28rem] w-[28rem] [--orb-c:rgba(253,230,138,0.35)]" />
        <svg className="absolute inset-x-0 top-40 h-24 w-full" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
          <path
            className="route-flow"
            d="M-20 26C300 76 700 6 1000 56C1200 88 1340 66 1460 76"
            stroke="#7DD3FC"
            strokeOpacity=".55"
            strokeWidth="2"
            strokeDasharray="6 11"
          />
        </svg>
      </div>
      <Nav />
      <main className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[.95fr_1.05fr]">
        <FlightScene />
        <FlightSearchForm />
      </main>
    </div>
  );
}
