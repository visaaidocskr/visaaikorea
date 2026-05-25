"use client";

import { useEffect, useState } from "react";

export default function ResultPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("visaApplication");

    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-2xl font-bold text-slate-700">
          Loading application...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-14 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-700">
            AI GENERATED RESULT
          </p>

          <h1 className="text-5xl font-extrabold">
            Embassy Ready Visa Package
          </h1>

          <p className="mt-5 text-xl text-slate-600">
            Your tourist visa documents have been prepared based on your profile.
          </p>
        </div>

        {/* Applicant Summary */}
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl">
          <h2 className="mb-8 text-4xl font-extrabold">
            Applicant Summary
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Nationality</p>
              <p className="mt-2 text-2xl font-bold">
                {data.nationality}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Korean Visa</p>
              <p className="mt-2 text-2xl font-bold">
                {data.koreanVisa}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Destination</p>
              <p className="mt-2 text-2xl font-bold">
                {data.destination === "Other"
                  ? data.otherDestination
                  : data.destination}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Travel Dates</p>

              <p className="mt-2 text-xl font-bold">
                {data.travelDate}
              </p>

              <p className="mt-1 text-lg text-slate-600">
                Return: {data.returnDate}
              </p>
            </div>
          </div>
        </div>

        {/* AI Embassy Report */}
        <div className="mt-10 rounded-[2rem] bg-white p-10 shadow-2xl">
          <h2 className="text-5xl font-extrabold">
            AI Embassy Report
          </h2>

          <p className="mt-5 text-xl leading-relaxed text-slate-600">
            This tourist visa package was generated based on the applicant
            profile, destination country, and embassy requirements.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <p className="text-xl font-bold text-blue-700">
                Embassy Confidence
              </p>

              <p className="mt-4 text-5xl font-extrabold text-slate-900">
                92%
              </p>

              <p className="mt-3 text-slate-600">
                Strong tourist profile based on Korean residence status and
                submitted information.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-xl font-bold text-emerald-700">
                AI Recommendation
              </p>

              <p className="mt-4 text-lg leading-relaxed text-slate-700">
                Keep your bank balance stable and ensure all reservation dates
                match your travel schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mt-10 rounded-[2rem] bg-white p-10 shadow-2xl">
          <h2 className="text-4xl font-extrabold">
            Generated Documents
          </h2>

          <div className="mt-8 grid gap-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-bold">
                Embassy Cover Letter
              </p>

              <p className="mt-2 text-slate-600">
                AI generated professional cover letter for embassy submission.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-bold">
                Travel Itinerary
              </p>

              <p className="mt-2 text-slate-600">
                Day-by-day tourism plan prepared for your destination.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-bold">
                Embassy Checklist
              </p>

              <p className="mt-2 text-slate-600">
                Required tourist visa documents based on embassy rules.
              </p>
            </div>
          </div>

          <button
            className="mt-10 w-full rounded-2xl bg-blue-700 py-5 text-xl font-bold text-white transition hover:bg-blue-800"
          >
            Download Visa Package
          </button>
        </div>
      </div>
    </main>
  );
}