"use client";

import { useEffect } from "react";
import { fetchResultRows, markAllSeen } from "@/app/components/resultsSeen";

// Renders nothing: opening My results marks every application update as
// read, clearing the nav badge on the next page view.
export function MarkResultsSeen() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const rows = await fetchResultRows(supabase);
        if (!cancelled && rows) markAllSeen(rows);
      } catch {
        // Signed out or unreachable — nothing to mark.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
