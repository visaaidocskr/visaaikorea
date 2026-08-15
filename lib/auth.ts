// Server-side auth helpers for Server Components / Server Actions.
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export { isSupabaseConfigured };

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "client" | "admin";
};

// Returns the signed-in user + profile, or null if not authenticated
// (or if Supabase isn't configured yet).
//
// Wrapped in React `cache()`: within one server request the auth check runs
// exactly once, even though requireUser/requireAdmin and several server actions
// each call it. This removes the duplicated auth.getUser() + profiles round-trips
// that previously fired 2–3× per page render.
export const getSessionUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
});

// Use at the top of a protected page. Redirects to /login if not signed in.
export async function requireUser() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

// Use at the top of an admin page. Redirects non-admins away.
export async function requireAdmin() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.profile?.role !== "admin") redirect("/dashboard");
  return session;
}
