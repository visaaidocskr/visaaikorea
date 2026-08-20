"use client";

import { useEffect } from "react";
import { markAllSeen, type ResultRow } from "@/app/components/resultsSeen";

// Renders nothing: opening My results marks every application update as
// read, clearing the nav badge on the next page view.
export function MarkResultsSeen() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("applications")
          .select("id, status, client_message");
        if (!cancelled && data) markAllSeen(data as ResultRow[]);
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
