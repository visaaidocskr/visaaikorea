"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export type ClientResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// Signed URL for a released document the signed-in client owns. RLS does the
// real enforcement: the generated_documents row is only visible when released
// AND owned, and the storage object only when the path is under the user's id.
export async function getClientDocSignedUrl(
  documentId: string
): Promise<ClientResult<{ url: string }>> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("generated_documents")
    .select("storage_path, released")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc || !doc.released) {
    return { ok: false, error: "Document not available." };
  }

  const { data, error } = await supabase.storage
    .from("generated-documents")
    .createSignedUrl(doc.storage_path, 60 * 10);

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create link." };
  }
  return { ok: true, data: { url: data.signedUrl } };
}
