// Fills an admin-uploaded .docx template's {{placeholders}} with application
// data using docxtemplater. Server-only.
import "server-only";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { buildTemplateData, type GenBundle } from "@/lib/docs/templateData";

export function fillDocxTemplate(
  templateBuffer: Buffer,
  bundle: GenBundle
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Missing placeholders render empty instead of throwing.
    nullGetter: () => "",
  });

  doc.render(buildTemplateData(bundle));

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
