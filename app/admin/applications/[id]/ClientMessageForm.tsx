"use client";

// Message TO the client, shown on their application page and emailed to them.
// Visually distinct from AddNoteForm (internal notes) on purpose — mixing the
// two up would either leak internal remarks to the applicant or leave them
// waiting on an instruction they never received.
import { useState, useTransition } from "react";
import { setClientMessage } from "@/app/admin/actions";

export function ClientMessageForm({
  applicationId,
  initialMessage,
  sentAt,
}: {
  applicationId: string;
  initialMessage: string;
  sentAt: string | null;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function save(next: string) {
    setMsg("");
    start(async () => {
      const res = await setClientMessage(applicationId, next);
      setMsg(
        res.ok
          ? next.trim()
            ? "Sent to the client and emailed."
            : "Message cleared."
          : res.error
      );
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        The client sees this on their application page, and it&rsquo;s emailed to
        them. Say exactly which document is wrong and what to do about it.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. The passport photo you uploaded is blurred at the bottom — please re-upload a clear photo of the whole page, including the two code lines."
        rows={4}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => save(message)}
          disabled={pending || message.trim() === ""}
          className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-800 disabled:bg-slate-300"
        >
          {pending ? "Sending…" : initialMessage ? "Update message" : "Send to client"}
        </button>
        {initialMessage && (
          <button
            onClick={() => {
              setMessage("");
              save("");
            }}
            disabled={pending}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Clear
          </button>
        )}
        {msg && <span className="text-sm font-semibold text-slate-600">{msg}</span>}
      </div>
      {sentAt && (
        <p className="text-xs text-slate-400">
          Last sent {new Date(sentAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
