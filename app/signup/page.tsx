import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/AuthShell";
import { SignupForm, GoogleButton } from "@/app/auth/AuthForms";

export const metadata: Metadata = { title: "Create Account · VisaAI Korea" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start preparing your tourist visa documents."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleButton />
      <SignupForm />
    </AuthShell>
  );
}
