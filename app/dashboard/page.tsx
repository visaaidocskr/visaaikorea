import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/SignOutButton";

export const metadata: Metadata = { title: "Dashboard · VisaAI Korea" };

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const displayName = profile?.full_name || user.email;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <Link href="/" className="text-xl font-extrabold text-blue-700">
          VisaAI Korea
        </Link>
        <div className="flex items-center gap-4">
          {profile?.role === "admin" && (
            <Link href="/admin" className="text-sm font-semibold text-blue-700">
              Admin
            </Link>
          )}
          <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
          Client Dashboard
        </p>
        <h1 className="mt-2 text-4xl font-extrabold">Welcome, {displayName}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          This is your home for visa applications. Start a new application or
          review the status of existing ones.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/apply?new=1"
            className="rounded-3xl bg-blue-700 p-8 text-white shadow-lg transition hover:bg-blue-800"
          >
            <h2 className="text-2xl font-bold">Start new application</h2>
            <p className="mt-2 text-blue-100">
              Choose a destination and prepare your documents.
            </p>
          </Link>

          <Link
            href="/dashboard/applications"
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300"
          >
            <h2 className="text-2xl font-bold">My applications</h2>
            <p className="mt-2 text-slate-600">
              View and track the status of your submitted applications.
            </p>
          </Link>

          <Link
            href="/dashboard/downloads"
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300"
          >
            <h2 className="text-2xl font-bold">Downloads</h2>
            <p className="mt-2 text-slate-600">
              Download visa documents released to you by our team.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
