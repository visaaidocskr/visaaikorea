"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth-redirect";

// Shape returned to the client forms via useActionState.
export type AuthState = { error?: string; message?: string };

function siteUrl() {
  // Prefer the configured public URL; fall back to the request origin.
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Passed into the new-user trigger via raw_user_meta_data.
      data: { full_name: fullName, phone },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  // "This address already has an account" is an answer we shouldn't give to
  // whoever asks. Anyone could type addresses into this form and learn which
  // of them are clients of ours — that alone is worth something to a scammer
  // targeting people applying for visas. Supabase already hides this when
  // email confirmation is enabled (it returns a decoy user); this covers the
  // case where it isn't, so the behaviour doesn't depend on a dashboard
  // toggle. The real owner still learns the truth — by email, or by trying
  // to sign in.
  if (error && /already registered|already exists|user already/i.test(error.message)) {
    return { message: SIGNUP_NEUTRAL_MESSAGE };
  }
  if (error) return { error: error.message };

  return { message: SIGNUP_NEUTRAL_MESSAGE };
}

// Identical wording for "created" and "already existed" — if the two differed
// at all, the difference itself would answer the question.
const SIGNUP_NEUTRAL_MESSAGE =
  "Check your email to confirm your address, then sign in. If you already have an account with this address, sign in instead.";

/**
 * Starts the Google sign-in flow.
 *
 * The round trip is: our site → Google → Supabase → our /auth/callback.
 * `redirectTo` is where SUPABASE sends the user once Google has approved —
 * Google itself always returns to Supabase's own callback, which is why the
 * URI registered in Google Cloud points at Supabase and not at us.
 *
 * Used for both signing in and signing up: Google either recognises the
 * account or creates one, so a separate "register with Google" path would
 * only be a way to get the two out of step.
 */
export async function signInWithGoogle(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };
  if (!data.url) return { error: "Could not start Google sign-in. Please try again." };

  // Server actions can't return a redirect to an external host as data, so
  // hand the browser straight to Google's consent screen.
  redirect(data.url);
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/dashboard/reset-password`,
  });

  if (error) return { error: error.message };

  return {
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };
}
