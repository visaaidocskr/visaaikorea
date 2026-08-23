import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// The card that appears when a link to the site is shared in Telegram,
// WhatsApp, Instagram or iMessage — which is where most of our clients first
// meet us. Generated at build time; no external fonts or images, so it can
// never fail on a missing asset.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DESTINATIONS = ["Japan", "Taiwan", "Singapore", "Vietnam", "Spain"];

// Satori ships only a single regular face, so the headline would render
// thin. Fetch Inter at build time; if the network is unavailable the card
// still builds — it just falls back to the default face.
async function loadFont(weight: 400 | 800): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const url = css.match(/src: url\((https:[^)]+\.(?:ttf|woff))\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [regular, bold] = await Promise.all([loadFont(400), loadFont(800)]);
  const fonts = [
    regular && { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    bold && { name: "Inter", data: bold, weight: 800 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(135deg, #020617 0%, #0b1a3f 55%, #0e2a5e 100%)",
          color: "#ffffff",
          fontFamily: fonts.length ? "Inter, sans-serif" : "sans-serif",
          position: "relative",
        }}
      >
        {/* Soft glows, drawn as gradients rather than blur filters. */}
        <div
          style={{
            position: "absolute",
            left: -160,
            top: -160,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -200,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(6,182,212,0) 70%)",
          }}
        />
        {/* Flight route */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <path
            d="M-20 420 C 300 300, 700 520, 1220 260"
            stroke="#60A5FA"
            strokeWidth="3"
            strokeDasharray="14 18"
            fill="none"
            opacity="0.55"
          />
          <circle cx="1000" cy="343" r="9" fill="#E0F2FE" />
        </svg>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #2563EB, #4F46E5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
            <span>VisaAI</span>
            <span style={{ color: "#67E8F9", marginLeft: 14 }}>Korea</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Your visa paperwork,
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              color: "#7DD3FC",
            }}
          >
            done properly.
          </div>
          <div style={{ marginTop: 14, fontSize: 30, color: "#CBD5E1" }}>
            {SITE_TAGLINE}
          </div>
        </div>

        {/* Destinations + operator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {DESTINATIONS.map((d) => (
              <div
                key={d}
                style={{
                  padding: "8px 18px",
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#E2E8F0",
                  fontWeight: 400,
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ color: "#94A3B8" }}>visaai.travel · Vitamin Travel</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
