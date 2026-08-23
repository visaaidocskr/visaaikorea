import type { MetadataRoute } from "next";
import { COUNTRIES } from "@/lib/visa/countryContent";
import { SITE_URL } from "@/lib/site";

// Every public page, with the destination guides generated from the same
// country list the wizard uses — a new destination appears here without
// anyone remembering to add it.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly"
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/services", 0.9, "weekly"),
    page("/destinations", 0.8),
    ...COUNTRIES.map((c) => page(`/destinations/${c.key}`, 0.8)),
    page("/flights", 0.7),
    page("/tours", 0.7),
    page("/invite", 0.7),
    page("/privacy", 0.3, "yearly"),
    page("/terms", 0.3, "yearly"),
    page("/refunds", 0.3, "yearly"),
  ];
}
