"use client";

import { useEffect, useRef, useState } from "react";

// Fades + lifts children into view once they enter the viewport.
//
// `immediate` is for content that is on screen at load (the hero): it plays
// the same entrance as a pure CSS animation, so it appears even before the
// JavaScript bundle has arrived — a slow phone never stares at a blank hero.
export function Reveal({
  children,
  delay = 0,
  className = "",
  immediate = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || immediate) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  if (immediate) {
    return (
      <div
        ref={ref}
        style={{ animationDelay: `${delay}ms` }}
        className={`reveal-now ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${shown ? "reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
