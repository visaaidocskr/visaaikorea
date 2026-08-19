import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/AuthShell";
import { SignInMethods, GoogleButton } from "@/app/auth/AuthForms";
import { safeNextPath } from "@/lib/auth-redirect";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Sign In · VisaAI Korea" };

// Next 16: searchParams is a Promise.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);

  return (
    <AuthShell
      title={t("auth.welcome")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          <p>
            {t("auth.noAccount")} {" "}
            <Link href="/signup" className="font-semibold text-blue-700">
              {t("auth.create")}
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/forgot-password" className="font-semibold text-blue-700">
              {t("auth.forgot")}
            </Link>
          </p>
        </>
      }
    >
      {error && (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
          {error === "auth_callback"
            ? t("auth.invalidLink")
            : // Real reason from the provider, so a misconfiguration is
              // diagnosable instead of hiding behind a generic message.
              error}
        </p>
      )}
      <GoogleButton next={safeNext} />
      <SignInMethods next={safeNext} />
    </AuthShell>
  );
}
