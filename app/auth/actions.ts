"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth-redirect";
import { isValidEmail } from "@/lib/visa/forms";

// Shape returned to the client forms via useActionState.
export type AuthState = { error?: string; message?: string };

// The code flow is two steps, so its state has to carry which one we're on
// and the address the code went to — the verify step needs it, and asking the
// applicant to type it twice would defeat the point.
export type CodeState = {
  error?: string;
  sent?: boolean;
  email?: string;
  /**
   * When the code was sent. The resend countdown is derived from this rather
   * than started by a timer, so it stays correct across re-renders and
   * restarts by itself whenever a new code actually goes out.
   */
  sentAt?: number;
};

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
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/`,
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

/**
 * Step 1 of signing in with a code: email the applicant a six-digit code.
 *
 * `shouldCreateUser: true` makes this both sign-in and sign-up — the same
 * behaviour as the Google button, and the reason it needs no password: an
 * applicant coming from an Instagram message gets in with an address and a
 * code, without inventing a password or leaving to click a confirmation link.
 *
 * It also removes the enumeration question entirely: the response is identical
 * whether or not an account already exists, because either way the outcome is
 * "a code was sent to that address".
 *
 * NOTE: whether Supabase sends a CODE or a magic LINK is decided by the email
 * template, not by this call. The template must render {{ .Token }} rather
 * than {{ .ConfirmationURL }}, and no `emailRedirectTo` may be passed here —
 * supplying one makes Supabase send a link instead.
 */
export async function sendEmailCode(
  _prev: CodeState,
  formData: FormData
): Promise<CodeState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { error: "Enter your email address." };
  if (!isValidEmail(email)) {
    return { error: "That doesn't look like a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    // Supabase rate-limits code sends per address. Saying so is more useful
    // than the raw message, which reads as a fault on our side.
    if (/rate limit|too many|security purposes/i.test(error.message)) {
      return {
        error: "Too many codes requested. Please wait a minute and try again.",
        sent: true,
        email,
        sentAt: Date.now(),
      };
    }
    return { error: error.message };
  }

  return { sent: true, email, sentAt: Date.now() };
}

/** Step 2: exchange the emailed code for a session. */
export async function verifyEmailCode(
  _prev: CodeState,
  formData: FormData
): Promise<CodeState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email) return { error: "Something went wrong. Please start again." };
  if (token.length !== 6) {
    return { error: "Enter the 6-digit code from your email.", sent: true, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    // Keep the applicant on the code step with the address intact, so a typo
    // costs one retype rather than restarting the whole flow.
    const expired = /expired|invalid/i.test(error.message);
    return {
      error: expired
        ? "That code is wrong or has expired. Check the latest email, or send a new code."
        : error.message,
      sent: true,
      email,
    };
  }

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
