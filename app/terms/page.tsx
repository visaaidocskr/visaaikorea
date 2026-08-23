import Link from "next/link";
import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { LEGAL_COPY } from "@/lib/legal-content";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const copy = LEGAL_COPY[await getRequestLocale()];
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <Link href="/" className="text-sm font-semibold text-blue-700">← {copy.back}</Link>
      <p className="mt-8 text-sm font-bold uppercase tracking-widest text-blue-600">{copy.effective} 19 August 2026</p>
      <h1 className="text-sky-gradient mt-4 text-4xl font-extrabold">{copy.termsTitle}</h1>
      <div className="mt-6 space-y-4 leading-relaxed">
        {copy.terms.map((section) => <section key={section.title}><h2 className="pt-4 text-xl font-bold">{section.title}</h2><p className="mt-2">{section.body}</p></section>)}
        <p>{BUSINESS.legalName} · {BUSINESS.address}. {copy.contact}: {BUSINESS.email}; Uzbekistan {BUSINESS.phones.uzbekistan}; Korea {BUSINESS.phones.korea}.</p>
        <p><Link href="/refunds" className="font-semibold text-blue-700 hover:underline">{copy.refundLink}</Link></p>
      </div>
    </main>
  );
}
