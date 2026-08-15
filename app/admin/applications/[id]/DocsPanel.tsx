"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  generateAllDocuments,
  generateFromTemplate,
  toggleDocumentReleased,
  getGeneratedDocSignedUrl,
  registerReservation,
  sendDocumentsReadyEmail,
} from "@/app/admin/doc-actions";

type GenDoc = {
  id: string;
  document_type: string;
  file_format: string | null;
  storage_path: string;
  generated_by: string | null;
  released: boolean;
};
type Template = { id: string; template_name: string };

export function DocsPanel({
  applicationId,
  userId,
  documents,
  templates,
}: {
  applicationId: string;
  userId: string;
  documents: GenDoc[];
  templates: Template[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function notify(res: { ok: boolean; error?: string }, okText: string) {
    setMsg(res.ok ? { kind: "ok", text: okText } : { kind: "err", text: res.error ?? "Failed." });
  }

  function genAll() {
    setMsg(null);
    start(async () => {
      const res = await generateAllDocuments(applicationId);
      notify(
        res,
        res.ok
          ? `Generated ${res.data?.generated.length ?? 0} document(s) — ${res.data?.generated.join(", ")}.`
          : ""
      );
    });
  }

  function genTemplate(templateId: string) {
    setMsg(null);
    start(async () => notify(await generateFromTemplate(applicationId, templateId), "Template document generated."));
  }

  function release(doc: GenDoc) {
    start(async () =>
      notify(await toggleDocumentReleased(doc.id, !doc.released, applicationId), "Updated.")
    );
  }

  async function open(path: string) {
    const res = await getGeneratedDocSignedUrl(path);
    if (res.ok && res.data) window.open(res.data.url, "_blank", "noopener,noreferrer");
    else if (!res.ok) setMsg({ kind: "err", text: res.error });
  }

  function onReservation(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    start(async () => {
      const supabase = createClient();
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
      const path = `${userId}/${applicationId}/${docType.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
      const { error } = await supabase.storage
        .from("generated-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setMsg({ kind: "err", text: error.message });
        return;
      }
      notify(
        await registerReservation({ applicationId, documentType: docType, storagePath: path }),
        `${docType} uploaded.`
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={genAll}
          disabled={pending}
          className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
        >
          {pending ? "Working…" : "Generate documents"}
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => genTemplate(t.id)}
            disabled={pending}
            className="rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            Generate: {t.template_name}
          </button>
        ))}
        <button
          onClick={() =>
            start(async () => {
              const res = await sendDocumentsReadyEmail(applicationId);
              notify(
                res,
                res.ok ? `Client notified (${res.data?.status}).` : ""
              );
            })
          }
          disabled={pending}
          className="rounded-xl border border-emerald-300 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          Email client: documents ready
        </button>
      </div>

      {msg && (
        <p className={`text-sm font-semibold ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}

      {/* Reservation uploads */}
      <div className="grid gap-3 sm:grid-cols-2">
        {["Air Ticket Reservation", "Hotel Reservation"].map((docType) => (
          <label
            key={docType}
            className="cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Upload {docType}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => onReservation(e, docType)}
            />
          </label>
        ))}
      </div>

      {/* Generated documents list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Document</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Released</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-semibold">{d.document_type}</td>
                <td className="px-4 py-2.5 text-slate-500">{d.generated_by ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      d.released ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {d.released ? "Released" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex gap-2">
                    <button
                      onClick={() => open(d.storage_path)}
                      className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => release(d)}
                      disabled={pending}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {d.released ? "Unrelease" : "Release to client"}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No documents generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
