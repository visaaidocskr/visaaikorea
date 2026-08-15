"use client";

import { useState, useTransition } from "react";
import { addAdminNote } from "@/app/admin/actions";

export function AddNoteForm({ applicationId }: { applicationId: string }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function submit() {
    setMsg("");
    start(async () => {
      const res = await addAdminNote(applicationId, note);
      if (res.ok) {
        setNote("");
        setMsg("Note added.");
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an internal note…"
        rows={3}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || note.trim() === ""}
          className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
        {msg && <span className="text-sm font-semibold text-slate-600">{msg}</span>}
      </div>
    </div>
  );
}
