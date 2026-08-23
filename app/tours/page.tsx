import type { Metadata } from "next";
import { Nav } from "@/app/components/landing/Nav";
import { TourRequestForm } from "@/app/tours/TourRequestForm";
import { TourScene } from "@/app/tours/TourScene";

export const metadata: Metadata = { title: "Tour quotation" };

export default function ToursPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50/70 via-rose-50/50 to-indigo-50/60 text-slate-900">
      {/* Golden-hour wash behind the whole page */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-orb absolute -left-32 top-24 h-96 w-96 [--orb-c:rgba(253,186,116,0.35)]" />
        <div className="glow-orb absolute -right-32 top-1/2 h-[28rem] w-[28rem] [--orb-c:rgba(196,181,253,0.3)]" />
        <svg className="absolute inset-x-0 top-40 h-24 w-full" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
          <path
            className="route-flow"
            d="M-20 70C300 20 700 90 1000 40C1200 8 1340 30 1460 20"
            stroke="#FDBA74"
            strokeOpacity=".5"
            strokeWidth="2"
            strokeDasharray="6 11"
          />
        </svg>
      </div>
      <Nav />
      <main className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[.95fr_1.05fr]">
        <TourScene />
        <TourRequestForm />
      </main>
    </div>
  );
}
