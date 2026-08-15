// Storage path conventions + helpers. The first path segment MUST be the
// owner's user id — the Storage RLS policies in 0002_applications.sql key off
// `storage.foldername(name)[1] = auth.uid()`.

export const APPLICANT_UPLOADS_BUCKET = "applicant-uploads";

// Maps a MIME type to a file extension for the stored object name.
function extensionFor(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
  };
  return map[file.type] ?? "bin";
}

// e.g. "8f3c…/a91b…/passport.jpg"
export function applicantUploadPath(
  userId: string,
  applicationId: string,
  fileType: string,
  file: File
): string {
  return `${userId}/${applicationId}/${fileType}.${extensionFor(file)}`;
}
