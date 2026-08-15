// Renders a server route to an A4 PDF using a headless browser. Server-only.
//
// We navigate Chromium to a real (token-protected) Next.js print route so the
// page is rendered with the exact same React component + Tailwind pipeline as
// the rest of the app — guaranteeing the PDF matches the on-screen form.
//
// Deployment note: locally this uses puppeteer's bundled Chromium. On
// serverless set PUPPETEER_EXECUTABLE_PATH to a compatible Chromium binary.
import "server-only";
import puppeteer, { type Browser } from "puppeteer";

async function launch(): Promise<Browser> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    ...(executablePath ? { executablePath } : {}),
  });
}

export async function renderRouteToPdf(url: string): Promise<Buffer> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const res = await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
    if (!res || !res.ok()) {
      throw new Error(`Print route returned HTTP ${res?.status() ?? "no response"}`);
    }
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
