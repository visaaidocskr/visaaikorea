"use client";

import { useTransition } from "react";
import { setTemplateActive, deleteTemplate } from "@/app/admin/templates/actions";

export function TemplateActions({
  id,
  active,
  storagePath,
}: {
  id: string;
  active: boolean;
  storagePath: string;
}) {
  const [pending, start] = useTransition();

  return (
    <span className="flex gap-2">
      <button
        onClick={() => start(async () => void (await setTemplateActive(id, !active)))}
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={() => {
          if (confirm("Delete this template?")) {
            start(async () => void (await deleteTemplate(id, storagePath)));
          }
        }}
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </span>
  );
}
