import Link from "next/link";
import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { LEGAL_COPY } from "@/lib/legal-content";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata: Metadata = { title: "Privacy Policy · VisaAI Korea" };

export default async function PrivacyPage() {
  const copy = LEGAL_COPY[await getRequestLocale()];
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <Link href="/" className="text-sm font-semibold text-blue-700">← {copy.back}</Link>
      <h1 className="text-sky-gradient mt-4 text-4xl font-extrabold">{copy.privacyTitle}</h1>
      <div className="mt-6 space-y-4 leading-relaxed">
        {copy.privacy.map((section) => <section key={section.title}><h2 className="pt-4 text-xl font-bold">{section.title}</h2><p className="mt-2">{section.body}</p></section>)}
        <p className="pt-4 text-sm text-slate-500">{BUSINESS.legalName} · {BUSINESS.email}</p>
      </div>
    </main>
  );
}
