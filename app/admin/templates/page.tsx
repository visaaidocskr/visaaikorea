import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TemplateUpload } from "./TemplateUpload";
import { TemplateActions } from "./TemplateActions";

export const metadata: Metadata = { title: "Templates · Admin" };

export default async function AdminTemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("document_templates")
    .select("id, template_name, template_type, destination_country, active, storage_path, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Document templates</h1>
      <p className="mt-2 text-slate-600">
        Upload .docx templates with placeholders; the system fills them per
        application.
      </p>

      <div className="mt-6">
        <TemplateUpload />
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Destination</th>
              <th className="px-5 py-3">Active</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(templates ?? []).map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-semibold">{t.template_name}</td>
                <td className="px-5 py-3 text-slate-600">{t.template_type || "—"}</td>
                <td className="px-5 py-3 text-slate-600">{t.destination_country || "All"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      t.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <TemplateActions id={t.id} active={t.active} storagePath={t.storage_path} />
                </td>
              </tr>
            ))}
            {(templates ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  No templates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
