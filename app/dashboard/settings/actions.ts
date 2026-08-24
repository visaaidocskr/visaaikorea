"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { BUSINESS } from "@/lib/business";

export type SettingsState = { error?: string; message?: string };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Name and phone live on the profile row; RLS lets a user update their own
// row but pins the role, so this can never be turned into an escalation.
export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { user } = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  if (!fullName) return { error: "Please enter your name as written in your passport." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);
  if (error) return { error: "Could not save your details. Please try again." };

  revalidatePath("/dashboard", "layout");
  return { message: "saved" };
}

export async function changePassword(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "password" };
}

// Deletion is a request, not a button that wipes data: an applicant may have
// an application in progress at an embassy, and some records must be kept
// for accounting. The team confirms by email before anything is removed.
export async function requestDeletion(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { user, profile } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (formData.get("confirm") !== "on") {
    return { error: "Please tick the box to confirm you want your account deleted." };
  }

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? BUSINESS.email;
  const name = escapeHtml(profile?.full_name || "");
  const email = escapeHtml(user.email ?? "");
  await Promise.allSettled([
    sendEmail({
      to: adminEmail,
      subject: `Account deletion request: ${user.email}`,
      html: `<p><strong>User:</strong> ${name} (${email})<br/><strong>User ID:</strong> ${user.id}</p><p><strong>Reason:</strong> ${escapeHtml(reason) || "—"}</p><p>Check for in-progress applications and legal retention before deleting.</p>`,
    }),
    user.email
      ? sendEmail({
          to: user.email,
          subject: `We received your deletion request — ${BUSINESS.brandName}`,
          html: `<p>Hello${name ? ` ${name}` : ""},</p><p>We received your request to delete your ${BUSINESS.brandName} account and files. Our team will confirm by email once it is done, usually within 5 business days. If you did not make this request, reply to this email immediately.</p>`,
        })
      : Promise.resolve(null),
  ]);
  return { message: "deletion" };
}
