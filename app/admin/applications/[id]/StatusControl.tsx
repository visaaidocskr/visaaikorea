"use client";

import { useState, useTransition } from "react";
import { updateApplicationStatus } from "@/app/admin/actions";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";

export function StatusControl({
  applicationId,
  current,
}: {
  applicationId: string;
  current: ApplicationStatus;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(current);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function save() {
    setMsg("");
    start(async () => {
      const res = await updateApplicationStatus(applicationId, status);
      setMsg(res.ok ? "Status updated." : res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
        className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold"
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={pending || status === current}
        className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
      >
        {pending ? "Saving…" : "Update status"}
      </button>
      {msg && <span className="text-sm font-semibold text-slate-600">{msg}</span>}
    </div>
  );
}
