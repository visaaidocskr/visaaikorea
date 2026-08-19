// Database-backed embassy closure calendar. It safely falls back to the
// reviewed in-code Japan calendar while the table is empty or a deployment has
// not yet applied migration 0016. This keeps the application usable and lets
// operations update temporary closures without a code deployment.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { allJapanEmbassyClosures, type EmbassyClosure } from "@/lib/visa/japanEmbassy";

type ClosureRow = {
  closure_date: string;
  name: string;
  source: "Korea" | "Japan" | "Embassy";
};

export async function resolveEmbassyClosures(
  destinationCountry: string
): Promise<EmbassyClosure[]> {
  const fallback = destinationCountry === "Japan" ? allJapanEmbassyClosures() : [];
  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("embassy_closures")
      .select("closure_date, name, source")
      .eq("destination_country", destinationCountry)
      .eq("active", true);
    if (error || !data?.length) return fallback;
    return data.map((row) => ({
      date: (row as ClosureRow).closure_date,
      name: (row as ClosureRow).name,
      source: (row as ClosureRow).source,
    }));
  } catch {
    return fallback;
  }
}
