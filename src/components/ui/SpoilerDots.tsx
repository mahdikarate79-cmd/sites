"use client";

import { useMemo } from "react";

const DOT_COUNT = 48;

export function SpoilerDots() {
  const dots = useMemo(
    () =>
      Array.from({ length: DOT_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 94}%`,
        top: `${(i * 23 + 11) % 92}%`,
        size: 1.5 + (i % 3) * 0.5,
        delay: `${(i * 0.37) % 2.4}s`,
        duration: `${1.2 + (i % 5) * 0.35}s`,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="spoiler-dot absolute rounded-full bg-white"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          }}
        />
      ))}
    </div>
  );
}
