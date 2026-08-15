import "server-only";

// Rasterizes the first page of a PDF to a PNG buffer, so passport MRZ
// auto-read (lib/ocr/passportMrz.ts) can accept a scanned/exported passport
// PDF (e.g. a CamScanner export), not just a JPG/PNG photo.
//
// Uses `mupdf` (MuPDF's official WASM build) rather than a
// pdfjs-dist + canvas combination: that combination was tried first and
// turned out to be unreliable for this exact job — it threw on a PDF with an
// unusual embedded font, and hard-segfaulted the Node process (not just an
// error — the whole server crashes) on an image-based PDF, which is exactly
// what a phone-scanned passport PDF is. mupdf's WASM renderer handled both
// cleanly with no native dependency, the same class of dependency
// (self-contained WASM) already proven safe in this codebase by tesseract.js.
import type * as MupdfNs from "mupdf";

const RENDER_SCALE = 3; // upscale so MRZ text at the bottom of the page OCRs cleanly

export async function renderFirstPdfPageToPng(pdfBuffer: Buffer): Promise<Buffer> {
  const mupdf = (await import("mupdf")) as typeof MupdfNs;

  const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");
  try {
    if (doc.countPages() < 1) {
      throw new Error("The PDF has no pages.");
    }
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
