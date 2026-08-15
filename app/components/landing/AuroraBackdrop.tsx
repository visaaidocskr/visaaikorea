"use client";

import { useEffect, useRef } from "react";

// Deterministic particle field (fixed values avoid SSR hydration mismatch).
const PARTICLES = [
  { left: "6%", size: 5, dur: 17, delay: 0 },
  { left: "14%", size: 3, dur: 22, delay: 6 },
  { left: "23%", size: 6, dur: 15, delay: 2 },
  { left: "31%", size: 4, dur: 25, delay: 9 },
  { left: "39%", size: 3, dur: 19, delay: 4 },
  { left: "47%", size: 5, dur: 21, delay: 12 },
  { left: "55%", size: 4, dur: 16, delay: 1 },
  { left: "62%", size: 6, dur: 24, delay: 7 },
  { left: "70%", size: 3, dur: 18, delay: 3 },
  { left: "78%", size: 5, dur: 23, delay: 10 },
  { left: "86%", size: 4, dur: 20, delay: 5 },
  { left: "93%", size: 3, dur: 26, delay: 8 },
];

export function AuroraBackdrop() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip the mouse light on touch devices and when motion is reduced.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const apply = () => {
      raf = 0;
      const el = glow.current;
      if (el) {
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Soft canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50" />

      {/* Aurora blobs — low opacity, heavily blurred, slow drift */}
      <div className="aurora aurora-1 -left-[10%] -top-[15%] h-[55vh] w-[55vh] bg-blue-300/35" />
      <div className="aurora aurora-2 -right-[12%] top-[2%] h-[50vh] w-[50vh] bg-indigo-300/35" />
      <div className="aurora aurora-3 left-[22%] top-[34%] h-[46vh] w-[46vh] bg-sky-300/25" />

      {/* Fine grid for AI depth (very subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            bottom: "-24px",
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Mouse-reactive glow */}
      <div ref={glow} className="mouse-glow" />
    </div>
  );
}
