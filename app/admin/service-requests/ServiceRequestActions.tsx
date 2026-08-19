"use client";

import { useState, useTransition } from "react";
import { updateServiceEnquiry, type EnquiryStatus } from "@/app/services/actions";

export function ServiceRequestActions({ id, status, quote, amount }: { id: string; status: EnquiryStatus; quote: string | null; amount: number | null }) {
  const [pending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState<EnquiryStatus>(status);
  const [nextQuote, setNextQuote] = useState(quote ?? "");
  const [nextAmount, setNextAmount] = useState(amount?.toString() ?? "");
  const [message, setMessage] = useState("");

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await updateServiceEnquiry(id, nextStatus, nextQuote, nextAmount);
      setMessage(result.ok ? "Saved." : result.error);
    });
  }

  return <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-3 sm:grid-cols-[160px_1fr_130px]"><select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as EnquiryStatus)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="received">Received</option><option value="reviewing">Reviewing</option><option value="quoted">Quoted & email client</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option></select><input value={nextAmount} onChange={(e) => setNextAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Quoted total USD" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" /><button onClick={save} disabled={pending} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button></div><textarea value={nextQuote} onChange={(e) => setNextQuote(e.target.value)} rows={4} placeholder="Quote details. When status is Quoted, this is emailed to the client." className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />{message && <p className={`mt-2 text-sm font-medium ${message === "Saved." ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}</div>;
}
