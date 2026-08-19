import Link from "next/link";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Dashboard · VisaAI Korea" };

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  const displayName = profile?.full_name || user.email;

  return (
    <main className="relative min-h-screen text-slate-900">
      <AuroraBackdrop />
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <Link href="/" className="text-xl font-extrabold text-blue-700">
          VisaAI Korea
        </Link>
        <div className="flex items-center gap-4">
          {profile?.role === "admin" && (
            <Link href="/admin" className="text-sm font-semibold text-blue-700">
              {t("dashboard.admin")}
            </Link>
          )}
          <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-700">
          <span aria-hidden className="sparkle text-cyan-500">✦</span>
          {t("dashboard.eyebrow")}
        </p>
        <h1 className="text-sky-gradient mt-2 text-4xl font-extrabold">{t("dashboard.welcome")}, {displayName}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          {t("dashboard.intro")}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/apply?new=1"
            className="card-lift rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-lg shadow-blue-500/30"
          >
            <h2 className="text-2xl font-bold">{t("dashboard.start")}</h2>
            <p className="mt-2 text-blue-100">
              {t("dashboard.startBody")}
            </p>
          </Link>

          <Link
            href="/dashboard/applications"
            className="card-lift rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur"
          >
            <h2 className="text-2xl font-bold">{t("dashboard.applications")}</h2>
            <p className="mt-2 text-slate-600">
              {t("dashboard.applicationsBody")}
            </p>
          </Link>

          <Link
            href="/dashboard/downloads"
            className="card-lift rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur"
          >
            <h2 className="text-2xl font-bold">{t("dashboard.downloads")}</h2>
            <p className="mt-2 text-slate-600">
              {t("dashboard.downloadsBody")}
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
