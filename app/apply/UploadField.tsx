"use client";

import { useEffect, useRef, useState } from "react";
import { uploadApplicantFile, removeUploadedFile } from "@/app/apply/actions";
import { FIELD_ERROR_ATTR } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
// Configurable via env; falls back to 10 MB.
const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 10;

type Status = "idle" | "uploading" | "done" | "error";

type Props = {
  applicationId: string;
  userId: string;
  fileType: string;
  label: string;
  labelKo?: string;
  hint?: string;
  required: boolean;
  initialFilename?: string;
  onUploaded: (fileType: string, filename: string) => void;
};

export function UploadField({
  applicationId,
  fileType,
  label,
  labelKo,
  hint,
  required,
  initialFilename,
  onUploaded,
}: Props) {
  const { t } = useLocale();
  const [filename, setFilename] = useState(initialFilename ?? "");
  const [status, setStatus] = useState<Status>(initialFilename ? "done" : "idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs to avoid leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      setStatus("error");
      setMessage(t("upload.fileType"));
      return;
    }
    if (file.size / (1024 * 1024) > MAX_MB) {
      setStatus("error");
      setMessage(t("upload.fileSize").replace("{size}", String(MAX_MB)));
      return;
    }

    // Local preview before/while uploading.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const img = file.type.startsWith("image/");
    setIsImage(img);
    setPreviewUrl(img ? URL.createObjectURL(file) : null);

    setStatus("uploading");
    setMessage("");

    // Read the file fully in the browser BEFORE sending. A file dragged
    // straight out of another app (Telegram, Mail) can be a lazy "file
    // promise" Safari fails to materialise mid-request — the multipart body
    // then truncates and the server sees "Unexpected end of form". Reading
    // it here forces materialisation, catches unreadable files with a clear
    // message, and sends a plain in-memory copy that cannot be yanked away.
    let payload: Blob;
    try {
      payload = new Blob([await file.arrayBuffer()], { type: file.type });
    } catch {
      setStatus("error");
      setMessage(t("upload.unreadable"));
      return;
    }
    if (payload.size === 0) {
      setStatus("error");
      setMessage(t("upload.unreadable"));
      return;
    }

    // Upload to Storage via a server action (service-role — browser-side storage
    // uploads need a session that no longer exists while login is off).
    const fd = new FormData();
    fd.append("file", payload, file.name);
    fd.append("applicationId", applicationId);
    fd.append("fileType", fileType);
    fd.append("required", String(required));

    let res: Awaited<ReturnType<typeof uploadApplicantFile>>;
    try {
      res = await uploadApplicantFile(fd);
    } catch {
      setStatus("error");
      setMessage(t("upload.failed"));
      return;
    }
    if (!res.ok) {
      setStatus("error");
      setMessage(res.error);
      return;
    }

    setFilename(file.name);
    setStatus("done");
    onUploaded(fileType, file.name);
  }

  async function remove() {
    setStatus("uploading");
    const res = await removeUploadedFile({ applicationId, fileType });
    if (!res.ok) {
      setStatus("error");
      setMessage(res.error);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFilename("");
    setMessage("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
    onUploaded(fileType, "");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (status === "uploading") return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  const done = status === "done";
  const uploading = status === "uploading";
  const errored = status === "error";

  const tone = done
    ? "border-emerald-300 bg-emerald-50/40"
    : errored
      ? "border-red-300 bg-red-50/40"
      : dragging
        ? "border-blue-600 bg-blue-50"
        : "border-slate-300 bg-white hover:border-blue-400";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!uploading) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-3xl border-2 border-dashed p-5 transition ${tone}`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail / file glyph */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl">
          {done && isImage && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : done ? (
            <span aria-hidden>{isImage ? "🖼️" : "📄"}</span>
          ) : (
            <span aria-hidden>⬆️</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </p>
          {labelKo && <p className="text-sm text-slate-500">{labelKo}</p>}
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}

          {/* Status line (announced) */}
          <p aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm">
            {uploading && <span className="font-semibold text-blue-700">{t("upload.uploading")}</span>}
            {done && filename && (
              <span className="font-semibold text-emerald-600">✓ {filename}</span>
            )}
            {errored && <span className="font-semibold text-red-600">{message}</span>}
            {status === "idle" && (
              <span className="text-slate-500">
                {t("upload.hint").replace("{size}", String(MAX_MB))}
              </span>
            )}
          </p>

          {uploading && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
              <div className="loader-sweep h-full w-1/3 rounded-full bg-blue-600" />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50"
            >
              {done ? t("upload.replace") : t("upload.choose")}
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 sm:hidden"
            >
              📷 {t("upload.photo")}
            </button>
            {done && (
              <button
                type="button"
                onClick={remove}
                disabled={uploading}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50"
              >
                {t("upload.remove")}
              </button>
            )}
          </div>

          {!done && required && status !== "uploading" && (
            <p
              {...{ [FIELD_ERROR_ATTR]: "" }}
              className="mt-2 text-xs font-semibold text-red-500"
            >
              {t("upload.required")}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={uploading}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}
