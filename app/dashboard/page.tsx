import Link from "next/link";
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
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
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
          {t("dashboard.eyebrow")}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold">{t("dashboard.welcome")}, {displayName}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          {t("dashboard.intro")}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/apply?new=1"
            className="rounded-3xl bg-blue-700 p-8 text-white shadow-lg transition hover:bg-blue-800"
          >
            <h2 className="text-2xl font-bold">{t("dashboard.start")}</h2>
            <p className="mt-2 text-blue-100">
              {t("dashboard.startBody")}
            </p>
          </Link>

          <Link
            href="/dashboard/applications"
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300"
          >
            <h2 className="text-2xl font-bold">{t("dashboard.applications")}</h2>
            <p className="mt-2 text-slate-600">
              {t("dashboard.applicationsBody")}
            </p>
          </Link>

          <Link
            href="/dashboard/downloads"
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300"
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
