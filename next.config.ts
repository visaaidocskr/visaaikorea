import type { NextConfig } from "next";

// Baseline security headers applied to every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // This allows only our own scripts/resources and the narrow set needed for
  // private-file previews. `unsafe-eval` is retained for Next development
  // tooling; production deployments should serve this same policy without it
  // once a nonce-based CSP is introduced.
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; worker-src 'self' blob:",
  },
];

// Document uploads are sent through a Server Action (uploadApplicantFile), so
// the Server Action request-body limit must cover the max upload size. Next's
// default is only 1MB, which silently rejected multi-MB passport/ARC files.
const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 10;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: `${MAX_UPLOAD_MB + 2}mb`,
    },
  },
  // tesseract.js (passport MRZ OCR) and mupdf (PDF-upload rasterization, so
  // MRZ OCR also works on PDF passport uploads) both ship WASM files that the
  // bundler shouldn't try to process — treat them as external so the server
  // just `require()`s them at runtime, same as any other Node dependency.
  // Without this, bundling them in can break other server actions on the
  // same page in dev (Turbopack).
  serverExternalPackages: ["tesseract.js", "tesseract.js-core", "mupdf"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
