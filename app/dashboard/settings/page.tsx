import Link from "next/link";
import type { Metadata } from "next";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";
import { DeletionForm, PasswordForm, ProfileForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Account settings" };

export default async function SettingsPage() {
  const { user, profile } = await requireUser();
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);

  return (
    <main className="relative min-h-screen text-slate-900">
      <AuroraBackdrop />
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <Link href="/" className="text-xl font-extrabold text-blue-700">
          VisaAI Korea
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSelector compact />
          <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
            {t("settings.back")}
          </Link>
          <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-700">
          <span aria-hidden className="sparkle text-cyan-500">✦</span>
          {t("settings.eyebrow")}
        </p>
        <h1 className="text-sky-gradient mt-2 text-4xl font-extrabold">{t("settings.title")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">{t("settings.intro")}</p>

        <div className="mt-10 space-y-6">
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            phone={profile?.phone ?? ""}
            email={user.email ?? ""}
          />
          <PasswordForm />
          <DeletionForm />
        </div>
      </div>
    </main>
  );
}
