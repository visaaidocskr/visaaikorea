// Exchanges the `code` from a Supabase email link (confirmation / password
// reset / magic link) for a session, then redirects into the app.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Validated, not trusted: this value survived a round trip through Google
  // and Supabase, so it must be re-checked before it becomes a redirect.
  const next = safeNextPath(searchParams.get("next"));

  // The provider (or Supabase) can reject before we ever get a code — e.g. the
  // user cancels at Google's consent screen, or the OAuth app isn't published
  // yet. Those arrive as error params, and passing the real reason through is
  // the difference between a fixable message and a blank "try again".
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(providerError)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
