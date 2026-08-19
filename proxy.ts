// Next 16 renamed the `middleware` file convention to `proxy`.
// Runs before every matched request: refreshes the Supabase session and
// enforces auth on /dashboard and /admin. See lib/supabase/proxy.ts.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Authenticated routes only. Running a remote `auth.getUser()` call for
    // every public landing/privacy/terms request added needless latency. Each
    // server action still authorizes itself; this just refreshes browser
    // sessions where a refreshed cookie is actually required.
    "/apply/:path*",
    "/invite/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
