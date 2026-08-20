"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { BUSINESS } from "@/lib/business";

export type ServiceKind = "flight" | "tour";
export type EnquiryStatus = "received" | "reviewing" | "quoted" | "closed" | "cancelled";

export type ServiceEnquiryInput = {
  kind: ServiceKind;
  fullName: string;
  residentialAddress: string;
  email: string;
  phone: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  returnDate: string;
  travellers: number;
  baggagePreference: "included" | "not_needed" | "unsure";
  hotelStars?: 2 | 3 | 4 | 5;
  notes: string;
};

export type ServiceActionResult = { ok: true; id: string } | { ok: false; error: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const trim = (value: string) => value.trim();

function validate(input: ServiceEnquiryInput): string | null {
  const required: Array<[string, string]> = [
    [input.fullName, "Please enter your full name."],
    [input.email, "Please enter your email address."],
    [input.phone, "Please enter your phone number."],
    [input.originCountry, "Please select your departure country."],
    [input.originCity, "Please enter your departure city."],
    [input.destinationCountry, "Please select your destination country."],
    [input.departureDate, "Please select your departure date."],
  ];
  for (const [value, message] of required) if (!trim(value)) return message;
  if (!emailPattern.test(trim(input.email))) return "Please enter a valid email address.";
  if (!Number.isInteger(input.travellers) || input.travellers < 1 || input.travellers > 20)
    return "Please choose between 1 and 20 travellers.";
  if (input.kind === "tour" && !input.hotelStars)
    return "Please choose your preferred hotel category.";
  if (input.returnDate && input.returnDate < input.departureDate)
    return "Your return date must be after your departure date.";
  return null;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function submitServiceEnquiry(input: ServiceEnquiryInput): Promise<ServiceActionResult> {
  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const email = trim(input.email).toLowerCase();
  const limit = enforceRateLimit(`service-enquiry:${email}`, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!limit.ok)
    return { ok: false, error: `Please wait ${limit.retryAfterSeconds} seconds before sending another request.` };

  const session = await getSessionUser();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_enquiries")
    .insert({
      user_id: session?.user.id ?? null,
      kind: input.kind,
      full_name: trim(input.fullName),
      residential_address: trim(input.residentialAddress) || "—",
      email,
      phone: trim(input.phone),
      origin_country: trim(input.originCountry),
      origin_city: trim(input.originCity),
      destination_country: trim(input.destinationCountry),
      destination_city: trim(input.destinationCity) || null,
      departure_date: input.departureDate,
      return_date: input.returnDate || null,
      travellers: input.travellers,
      baggage_preference: input.baggagePreference,
      hotel_stars: input.kind === "tour" ? input.hotelStars ?? null : null,
      notes: trim(input.notes) || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("service_enquiry_insert_failed", { code: error?.code, message: error?.message });
    return { ok: false, error: "We could not save your request. Please try again or contact our team." };
  }

  const serviceName = input.kind === "flight" ? "flight quotation" : "tour quotation";
  const safeName = escapeHtml(trim(input.fullName));
  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: `We received your ${serviceName} request`,
      html: `<p>Hello ${safeName},</p><p>We received your request. Our travel team will contact you by email within <strong>10 hours</strong> with an exact price and suitable options.</p><p>This is a quotation request, not a confirmed booking. Please do not make travel plans until you receive our written confirmation.</p>`,
    }),
    process.env.ADMIN_NOTIFY_EMAIL
      ? sendEmail({
          to: process.env.ADMIN_NOTIFY_EMAIL,
          subject: `New ${serviceName}: ${trim(input.fullName)}`,
          html: `<p><strong>Client:</strong> ${safeName}<br/><strong>Email:</strong> ${escapeHtml(email)}<br/><strong>Route:</strong> ${escapeHtml(trim(input.originCity))}, ${escapeHtml(trim(input.originCountry))} → ${escapeHtml(trim(input.destinationCity || input.destinationCountry))}, ${escapeHtml(trim(input.destinationCountry))}<br/><strong>Request ID:</strong> ${data.id}</p>`,
        })
      : Promise.resolve({ ok: false, status: "no_admin_email" }),
  ]);

  return { ok: true, id: data.id };
}

export async function updateServiceEnquiry(
  id: string,
  status: EnquiryStatus,
  quote: string,
  amountUsd: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Invalid request." };
  if (!["received", "reviewing", "quoted", "closed", "cancelled"].includes(status))
    return { ok: false, error: "Invalid status." };

  const parsedAmount = amountUsd.trim() ? Number(amountUsd) : null;
  if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount < 0))
    return { ok: false, error: "Enter a valid amount." };
  if (status === "quoted" && !trim(quote))
    return { ok: false, error: "Add the quotation details before sending it." };

  const admin = createAdminClient();
  const { data: enquiry, error: lookupError } = await admin
    .from("service_enquiries")
    .select("email, full_name, kind")
    .eq("id", id)
    .maybeSingle();
  if (lookupError || !enquiry) return { ok: false, error: "Request not found." };

  const { error } = await admin
    .from("service_enquiries")
    .update({
      status,
      admin_quote: trim(quote) || null,
      quoted_amount_usd: parsedAmount,
      quoted_at: status === "quoted" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not update the request." };

  if (status === "quoted") {
    const amountLine = parsedAmount !== null ? `<p><strong>Quoted total: USD ${parsedAmount.toFixed(2)}</strong></p>` : "";
    await sendEmail({
      to: enquiry.email,
      subject: `Your ${enquiry.kind} quotation from ${BUSINESS.brandName}`,
      html: `<p>Hello ${escapeHtml(enquiry.full_name)},</p>${amountLine}<p>${escapeHtml(trim(quote)).replace(/\n/g, "<br/>")}</p><p>Please reply to this email or contact our team to confirm the option you prefer. A quotation is not a confirmed booking until we confirm availability and payment.</p>`,
    });
  }

  revalidatePath("/admin/service-requests");
  return { ok: true };
}
