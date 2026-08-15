"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { DESTINATIONS } from "@/lib/visa/config";
import { registerTemplate } from "@/app/admin/templates/actions";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function TemplateUpload() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [destination, setDestination] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function submit() {
    setMsg(null);
    if (!file || !name.trim() || !type.trim()) {
      setMsg({ kind: "err", text: "Name, type, and a .docx file are required." });
      return;
    }
    if (file.type !== DOCX_MIME && !file.name.endsWith(".docx")) {
      setMsg({ kind: "err", text: "Only .docx templates are supported." });
      return;
    }

    start(async () => {
      const supabase = createClient();
      const path = `${destination || "all"}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("document-templates")
        .upload(path, file, { contentType: DOCX_MIME, upsert: false });
      if (error) {
        setMsg({ kind: "err", text: error.message });
        return;
      }
      const res = await registerTemplate({
        templateName: name.trim(),
        templateType: type.trim(),
        destinationCountry: destination,
        processingType: "",
        storagePath: path,
      });
      if (res.ok) {
        setMsg({ kind: "ok", text: "Template uploaded." });
        setName("");
        setType("");
        setFile(null);
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold">Upload a .docx template</h2>
      <p className="mt-1 text-sm text-slate-500">
        Use placeholders like <code>{"{{applicant.full_name}}"}</code>,{" "}
        <code>{"{{application.destination_country}}"}</code>, and loops over{" "}
        <code>{"{{#companions}}…{{/companions}}"}</code>.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name (e.g. Japan Application Form)"
          className="rounded-xl border border-slate-300 px-4 py-2.5"
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Document type (e.g. Application Form)"
          className="rounded-xl border border-slate-300 px-4 py-2.5"
        />
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2.5"
        >
          <option value="">All destinations</option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-xl border border-slate-300 px-4 py-2"
        />
      </div>
      {msg && (
        <p
          className={`mt-3 text-sm font-semibold ${
            msg.kind === "ok" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {msg.text}
        </p>
      )}
      <button
        onClick={submit}
        disabled={pending}
        className="mt-4 rounded-xl bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
      >
        {pending ? "Uploading…" : "Upload template"}
      </button>
    </div>
  );
}
