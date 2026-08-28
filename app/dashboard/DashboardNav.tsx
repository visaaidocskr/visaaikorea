import Link from "next/link";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

// Compact header for the dashboard's inner pages (applications, downloads,
// application detail): the brand always leads home, and the dashboard is one
// click away — no page should ever be a dead end.
export async function DashboardNav() {
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sm:px-8">
      <Link href="/" className="text-xl font-extrabold text-blue-700">
        VisaAI Korea
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSelector compact />
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
          {t("settings.back")}
        </Link>
        <SignOutButton />
      </div>
    </nav>
  );
}
