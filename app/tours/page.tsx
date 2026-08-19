import type { Metadata } from "next";
import { Nav } from "@/app/components/landing/Nav";
import { ServiceEnquiryForm } from "@/app/services/ServiceEnquiryForm";
import { TourScene } from "@/app/tours/TourScene";

export const metadata: Metadata = { title: "Tour quotation · VisaAI Korea" };

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[.95fr_1.05fr]">
        <TourScene />
        <ServiceEnquiryForm kind="tour" />
      </main>
    </div>
  );
}
