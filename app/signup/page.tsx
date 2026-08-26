import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/AuthShell";
import { SignupForm, GoogleButton } from "@/app/auth/AuthForms";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Create Account" };

export default async function SignupPage() {
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  return (
    <AuthShell
      title={t("auth.signupTitle")}
      subtitle={t("auth.signupSubtitle")}
      footer={
        <p>
          {t("auth.hasAccount")} {" "}
          <Link href="/login" className="font-semibold text-blue-700">
            {t("auth.signIn")}
          </Link>
        </p>
      }
    >
      <GoogleButton />
      <SignupForm />
    </AuthShell>
  );
}
