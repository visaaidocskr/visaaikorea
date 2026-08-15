import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/AuthShell";
import { ForgotPasswordForm } from "@/app/auth/AuthForms";

export const metadata: Metadata = { title: "Reset Password · VisaAI Korea" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <p>
          <Link href="/login" className="font-semibold text-blue-700">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
