import "server-only";

// General-purpose "get me the raw text of this uploaded document" helper,
// used by the flight/hotel reservation auto-fill (lib/ocr/reservationParse.ts)
// — unlike passport MRZ, these documents have no standard format, so the
// pipeline here is best-effort: read the file, get *some* text out of it, and
// let heuristics have a go at it downstream. The applicant/agent always
// reviews and can edit every suggested field, same "never fabricate" rule as
// the rest of the OCR pipeline.
//
// Two extraction paths, tried in order for PDFs:
//   1. mupdf's text layer (page.toStructuredText().asText()) — instant and
//      accurate for "real" PDFs (most e-tickets/booking confirmations are
//      generated straight from a reservation system, not scanned).
//   2. If that comes back too thin (a scanned/photographed PDF has no text
//      layer), fall back to rasterizing page 1 and running general OCR —
//      the same tesseract.js already used for passport MRZ, just without the
//      MRZ character whitelist.
// Plain images (JPG/PNG) always go straight to OCR.
import { createWorker } from "tesseract.js";
import type * as MupdfNs from "mupdf";

const RENDER_SCALE = 3;
const MAX_TEXT_PAGES = 5; // bound cost on multi-page PDFs; reservations are 1-2 pages

async function extractPdfTextLayer(pdfBuffer: Buffer): Promise<string> {
  const mupdf = (await import("mupdf")) as typeof MupdfNs;
  const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");
  try {
    const pageCount = Math.min(doc.countPages(), MAX_TEXT_PAGES);
    const parts: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      try {
        parts.push(page.toStructuredText().asText());
      } finally {
        page.destroy();
      }
    }
    return parts.join("\n\n");
  } finally {
    doc.destroy();
  }
}

async function rasterizeFirstPdfPage(pdfBuffer: Buffer): Promise<Buffer> {
  const mupdf = (await import("mupdf")) as typeof MupdfNs;
  const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");
  try {
    if (doc.countPages() < 1) throw new Error("The PDF has no pages.");
    const page = doc.loadPage(0);
    try {
      const matrix = mupdf.Matrix.scale(RENDER_SCALE, RENDER_SCALE);
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      try {
        return Buffer.from(pixmap.asPNG());
      } finally {
        pixmap.destroy();
      }
    } finally {
      page.destroy();
    }
  } finally {
    doc.destroy();
  }
}

async function ocrImage(imageBuffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    return text;
  } finally {
    await worker.terminate();
  }
}

// A text-layer read this short means "no real text layer" (e.g. a scanned
// PDF with just an embedded photo) rather than a genuinely near-empty page.
const MIN_USABLE_TEXT_LENGTH = 40;

export async function extractDocumentText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const layerText = await extractPdfTextLayer(fileBuffer).catch(() => "");
    if (layerText.trim().length >= MIN_USABLE_TEXT_LENGTH) return layerText;
    // Thin/empty text layer — likely a scanned PDF. Fall back to OCR.
    const png = await rasterizeFirstPdfPage(fileBuffer);
    return ocrImage(png);
  }
  // image/jpeg, image/png
  return ocrImage(fileBuffer);
}
