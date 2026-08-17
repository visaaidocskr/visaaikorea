"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateInvitationDocuments,
  releaseInvitationDocuments,
  invitationDocumentUrl,
} from "@/app/admin/invite-actions";

export function InvitationActions({
  invitationId,
  hasDocuments,
}: {
  invitationId: string;
  hasDocuments: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"generate" | "release" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy("generate");
    setError(null);
    setMessage(null);
    const res = await generateInvitationDocuments(invitationId);
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(`Generated ${res.data?.generated.length ?? 0} documents.`);
    router.refresh();
  }

  async function release() {
    setBusy("release");
    setError(null);
    setMessage(null);
    const res = await releaseInvitationDocuments(invitationId);
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Released to the client.");
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={busy !== null}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-300"
        >
          {busy === "generate"
            ? "Generating…"
            : hasDocuments
              ? "Regenerate documents"
              : "Generate documents"}
        </button>

        {hasDocuments && (
          <button
            type="button"
            onClick={release}
            disabled={busy !== null}
            className="rounded-xl border border-emerald-600 px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
          >
            {busy === "release" ? "Releasing…" : "Release to client"}
          </button>
        )}
      </div>

      {message && (
        <p className="mt-3 text-sm font-semibold text-emerald-700">{message}</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function DocumentLink({ documentId, label }: { documentId: string; label: string }) {
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const res = await invitationDocumentUrl(documentId);
    setBusy(false);
    if (res.ok && res.data) window.open(res.data.url, "_blank", "noopener");
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50"
    >
      {busy ? "Opening…" : label}
    </button>
  );
}
