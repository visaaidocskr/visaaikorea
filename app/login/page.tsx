import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/AuthShell";
import { SignInMethods, GoogleButton } from "@/app/auth/AuthForms";
import { safeNextPath } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Sign In · VisaAI Korea" };

// Next 16: searchParams is a Promise.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your visa applications."
      footer={
        <>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-700">
              Create one
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/forgot-password" className="font-semibold text-blue-700">
              Forgot your password?
            </Link>
          </p>
        </>
      }
    >
      {error && (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
          {error === "auth_callback"
            ? "That link was invalid or expired. Please sign in again."
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
