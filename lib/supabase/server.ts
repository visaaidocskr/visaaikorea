// Server Component / Server Action / Route Handler Supabase client.
// NOTE (Next 16): `cookies()` is async — must be awaited.
//
// Wrapped in React `cache()` so repeated calls within a SINGLE server request
// (e.g. requireUser + getOrCreateDraft + resolveRuleset all need a client)
// reuse one instance instead of re-awaiting cookies() and rebuilding the client
// each time. cache() is request-scoped, so different users never share a client.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` was called from a Server Component (cookies are
            // read-only there). Safe to ignore — the proxy refreshes the
            // session, so tokens stay current.
          }
        },
      },
    }
  );
});
