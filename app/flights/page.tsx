import type { Metadata } from "next";
import { Nav } from "@/app/components/landing/Nav";
import { ServiceEnquiryForm } from "@/app/services/ServiceEnquiryForm";
import { ServiceIntro } from "@/app/services/ServiceIntro";

export const metadata: Metadata = { title: "Flight quotation · VisaAI Korea" };

export default function FlightsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[.8fr_1.2fr]">
        <ServiceIntro kind="flight" />
        <ServiceEnquiryForm kind="flight" />
      </main>
    </div>
  );
}
