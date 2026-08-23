import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public pages are crawlable; everything behind a session (the wizard, the
// client dashboard, the admin area) and the auth plumbing is not — there is
// nothing there for a search engine to index, and the crawler would only
// bounce off the login redirect anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/apply", "/auth", "/api", "/print"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
