"use client";

import { useState, useTransition } from "react";
import { getClientDocSignedUrl } from "@/app/dashboard/actions";

export function DownloadButton({ documentId }: { documentId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function download() {
    setErr("");
    start(async () => {
      const res = await getClientDocSignedUrl(documentId);
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
        onClick={download}
        disabled={pending}
        className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-800 disabled:bg-slate-300"
      >
        {pending ? "Preparing…" : "Download"}
      </button>
      {err && <span className="text-xs font-semibold text-red-500">{err}</span>}
    </span>
  );
}
