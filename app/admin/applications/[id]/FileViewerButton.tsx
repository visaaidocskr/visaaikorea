"use client";

import { useState, useTransition } from "react";
import { getUploadSignedUrl } from "@/app/admin/actions";

// Fetches a short-lived signed URL on demand and opens it in a new tab.
export function FileViewerButton({ storagePath }: { storagePath: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function open() {
    setErr("");
    start(async () => {
      const res = await getUploadSignedUrl(storagePath);
      if (res.ok && res.data) {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
      } else if (!res.ok) {
        setErr(res.error);
      }
    });
  }

  return (
    <span className="flex items-center gap-2">
      <button
        onClick={open}
        disabled={pending}
        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 disabled:bg-slate-300"
      >
        {pending ? "Opening…" : "View / download"}
      </button>
      {err && <span className="text-xs font-semibold text-red-500">{err}</span>}
    </span>
  );
}
