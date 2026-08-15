"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/app/admin/actions";

export function RoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: "client" | "admin";
  isSelf: boolean;
}) {
  const [current, setCurrent] = useState(role);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const next = current === "admin" ? "client" : "admin";

  function toggle() {
    setErr("");
    start(async () => {
      const res = await setUserRole(userId, next);
      if (res.ok) setCurrent(next);
      else setErr(res.error);
    });
  }

  if (isSelf) {
    return <span className="text-xs text-slate-400">You</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "…" : current === "admin" ? "Demote to client" : "Promote to admin"}
      </button>
      {err && <span className="text-xs font-semibold text-red-500">{err}</span>}
    </span>
  );
}
