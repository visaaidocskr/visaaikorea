// Service-role Supabase client — bypasses RLS. SERVER ONLY.
// Never import this into a Client Component. Use only in trusted server code
// (admin data access, generating signed URLs, etc.). Added now so later
// phases can import it; not used by Phase 1 auth flows.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
