// Single source of truth for "is Supabase usable right now?".
// Pure (no imports) so it can be used from proxy, server, and client code.
//
// Returns false when the env vars are missing OR still hold the template
// placeholder values from .env.local.example — so the public site degrades
// gracefully instead of 500-ing before real credentials are added.
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) return false;

  const looksLikePlaceholder =
    url.includes("YOUR-PROJECT-ref") ||
    url.includes("placeholder") ||
    key.startsWith("your-") ||
    key.includes("placeholder");

  return !looksLikePlaceholder;
}
