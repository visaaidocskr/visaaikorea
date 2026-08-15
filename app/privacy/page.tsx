import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy · VisaAI Korea" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <Link href="/" className="text-sm font-semibold text-blue-700">← Home</Link>
      <h1 className="mt-4 text-4xl font-extrabold">Privacy Policy</h1>
      <div className="mt-6 space-y-4 leading-relaxed">
        <p>
          VisaAI Korea (&quot;we&quot;) prepares tourist visa documents for
          foreigners living in South Korea. This policy explains what we collect
          and how we protect it.
        </p>
        <h2 className="pt-4 text-xl font-bold">Information we collect</h2>
        <p>
          Account details (name, email, phone), application information
          (nationality, Korean visa status, travel plans, address), and uploaded
          documents (passport, ARC, and supporting files) that you choose to
          provide.
        </p>
        <h2 className="pt-4 text-xl font-bold">How we store it</h2>
        <p>
          Uploaded documents are kept in private storage. They are not publicly
          accessible. Only you can access your own files, and our administrators
          can access files solely to prepare your documents. Download links are
          temporary and expire shortly after they are created.
        </p>
        <h2 className="pt-4 text-xl font-bold">How we use it</h2>
        <p>
          We use your information only to prepare your visa document package and
          to communicate with you about your application. We do not sell your
          personal data.
        </p>
        <h2 className="pt-4 text-xl font-bold">Your choices</h2>
        <p>
          You may request deletion of your account and associated files by
          contacting us. Some records may be retained where required by law.
        </p>
        <p className="pt-4 text-sm text-slate-500">
          Visa approval is decided only by the embassy, consulate, or immigration
          authority. This service does not guarantee visa approval.
        </p>
      </div>
    </main>
  );
}
