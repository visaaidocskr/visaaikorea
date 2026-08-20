// Client-side "unread results" tracking, app-badge style. When the admin
// changes an application's status or leaves a message, the client sees a
// count on "My results" before opening it. What counts as read is stored in
// localStorage per device: visiting the applications list marks everything
// seen. Advisory only — no server state, no migrations.
export const RESULTS_SEEN_KEY = "visaai-results-seen-v1";

export type ResultRow = {
  id: string;
  status: string;
  client_message: string | null;
};

export function signatureOf(row: ResultRow): string {
  return `${row.status}|${row.client_message ?? ""}`;
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
