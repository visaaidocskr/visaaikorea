"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type TplResult = { ok: true } | { ok: false; error: string };

// Records a template the admin uploaded directly to the document-templates bucket.
export async function registerTemplate(input: {
  templateName: string;
  templateType: string;
  destinationCountry: string;
  processingType: string;
  storagePath: string;
}): Promise<TplResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("document_templates").insert({
    template_name: input.templateName,
    template_type: input.templateType,
    destination_country: input.destinationCountry || null,
    processing_type: input.processingType || null,
    storage_path: input.storagePath,
    active: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function setTemplateActive(
  id: string,
  active: boolean
): Promise<TplResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_templates")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function deleteTemplate(
  id: string,
  storagePath: string
): Promise<TplResult> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();
  await admin.storage.from("document-templates").remove([storagePath]);
  const { error } = await supabase.from("document_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/templates");
  return { ok: true };
}
