import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service · VisaAI Korea" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <Link href="/" className="text-sm font-semibold text-blue-700">← Home</Link>
      <h1 className="mt-4 text-4xl font-extrabold">Terms of Service</h1>
      <div className="mt-6 space-y-4 leading-relaxed">
        <p>
          By using VisaAI Korea you agree to these terms. We prepare visa
          document packages based on the information you provide.
        </p>
        <h2 className="pt-4 text-xl font-bold">Our service</h2>
        <p>
          We are a document-preparation service. We are not a government agency
          and, where embassy guidance states there are no authorised agents, we
          do not act as an official agent. We only prepare documents.
        </p>
        <h2 className="pt-4 text-xl font-bold">No guarantee of approval</h2>
        <p>
          Vitamin VisaAI prepares documents based on information provided by the
          client. Visa approval is decided only by the embassy, consulate, or
          immigration authority. This service does not guarantee visa approval.
        </p>
        <h2 className="pt-4 text-xl font-bold">Your responsibilities</h2>
        <p>
          You are responsible for the accuracy of the information and documents
          you provide. Submitting false information may lead to visa refusal and
          is your responsibility.
        </p>
        <h2 className="pt-4 text-xl font-bold">Payment and refunds</h2>
        <p>
          Fees, if any, are for document preparation work and are not contingent
          on the outcome of your visa application.
        </p>
      </div>
    </main>
  );
}
