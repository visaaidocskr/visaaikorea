// Client-side "unread results" tracking, app-badge style. When the admin
// changes an application's status or leaves a message, the client sees a
// count on "My results" before opening it. What counts as read is stored in
// localStorage per device: visiting the applications list marks everything
// seen. Advisory only — no server state, no migrations.
export const RESULTS_SEEN_KEY = "visaai-results-seen-v2";

export type ResultRow = {
  id: string;
  status: string;
  client_message: string | null;
  /** Documents the admin has released to this client for this application. */
  releasedCount: number;
};

export function signatureOf(row: ResultRow): string {
  return `${row.status}|${row.client_message ?? ""}|${row.releasedCount}`;
}

/**
 * Applications + how many released documents each has. RLS scopes both
 * queries to the signed-in client (and to released documents only), so this
 * is safe to run from the browser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchResultRows(supabase: any): Promise<ResultRow[] | null> {
  const { data: apps } = await supabase
    .from("applications")
    .select("id, status, client_message");
  if (!apps) return null;
  const { data: docs } = await supabase
    .from("generated_documents")
    .select("application_id")
    .eq("released", true);
  const counts = new Map<string, number>();
  for (const doc of (docs ?? []) as Array<{ application_id: string }>) {
    counts.set(doc.application_id, (counts.get(doc.application_id) ?? 0) + 1);
  }
  return (apps as Array<{ id: string; status: string; client_message: string | null }>).map(
    (a) => ({ ...a, releasedCount: counts.get(a.id) ?? 0 })
  );
}

/** Number of applications changed since the last visit to My results. */
export function countUnseen(rows: ResultRow[]): number {
  try {
    const raw = localStorage.getItem(RESULTS_SEEN_KEY);
    // Never visited: no baseline to compare against, so no badge — the
    // first visit to My results establishes it.
    if (!raw) return 0;
    const seen = JSON.parse(raw) as Record<string, string>;
    return rows.filter((row) =>
      row.id in seen ? seen[row.id] !== signatureOf(row) : row.status !== "draft"
    ).length;
  } catch {
    return 0;
  }
}

export function markAllSeen(rows: ResultRow[]): void {
  const map: Record<string, string> = {};
  for (const row of rows) map[row.id] = signatureOf(row);
  try {
    localStorage.setItem(RESULTS_SEEN_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable (private mode etc.) — badge simply stays advisory.
  }
}
