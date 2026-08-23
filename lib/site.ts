// The public origin of the site, used wherever an absolute URL must be
// emitted (sitemap, robots, Open Graph). Falls back to the production
// domain rather than localhost so a missing env var can never leak a
// "http://localhost:3000" link into a crawler or a shared preview.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://visaai.travel"
).replace(/\/$/, "");

export const SITE_NAME = "VisaAI Korea";
export const SITE_TAGLINE = "Tourist visa documents for foreigners living in Korea";
export const SITE_DESCRIPTION =
  "Tourist visa document preparation for foreigners living in South Korea — Japan, Taiwan, Singapore, Vietnam and Spain. Matched to your nationality and Korean visa status, checked by our team.";
