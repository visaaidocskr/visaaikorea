// Retired route.
//
// This used to render a replica of the "Visa Application Form for Entry into
// Taiwan, R.O.C." for PDF generation. It has been switched off because the
// R.O.C. accepts only the form produced by its own portal
// (visawebapp.boca.gov.tw): that printout carries a scannable barcode linking
// the paper to the record in Taiwan's system, and the mission declines any
// other form. Producing a lookalike would be rejected on submission and, if
// it imitated the barcode, would amount to forging an official document.
//
// Taiwan applications are now handled by our staff entering the collected
// data on the portal and emailing the official PDF to the client to sign.
//
// The route is kept (rather than deleted) only because removing files in this
// workspace needs the owner's explicit approval; it always 404s.
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TaiwanPrintPage() {
  notFound();
}
