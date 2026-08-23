import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/AuthShell";
import { ForgotPasswordForm } from "@/app/auth/AuthForms";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ForgotPasswordPage() {
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  return (
    <AuthShell
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      footer={
        <p>
          <Link href="/login" className="font-semibold text-blue-700">
            {t("auth.back")}
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
