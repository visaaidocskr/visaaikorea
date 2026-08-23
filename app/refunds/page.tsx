import Link from "next/link";
import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { LEGAL_COPY } from "@/lib/legal-content";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata: Metadata = { title: "Refund Policy" };

export default async function RefundsPage() {
  const copy = LEGAL_COPY[await getRequestLocale()];
  return <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800"><Link href="/" className="text-sm font-semibold text-blue-700">← {copy.back}</Link><p className="mt-8 text-sm font-bold uppercase tracking-widest text-blue-600">{copy.effective} 19 August 2026</p><h1 className="text-sky-gradient mt-4 text-4xl font-extrabold">{copy.refundTitle}</h1><div className="mt-7 space-y-6 leading-relaxed">{copy.refunds.map((section) => <Policy key={section.title} title={section.title} body={section.body} />)}<p className="rounded-2xl bg-slate-50 p-5 text-sm">{copy.contact}: <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p></div></main>;
}
function Policy({ title, body }: { title: string; body: string }) { return <section><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-slate-600">{body}</p></section>; }
