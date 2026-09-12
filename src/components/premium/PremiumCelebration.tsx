"use client";

import { useEffect, useMemo } from "react";

interface PremiumCelebrationProps {
  active: boolean;
  onDone?: () => void;
}

export function PremiumCelebration({ active, onDone }: PremiumCelebrationProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${8 + (i * 17) % 84}%`,
        top: `${5 + (i * 23) % 80}%`,
        size: 6 + (i % 4) * 4,
        delay: `${(i * 0.08) % 1.2}s`,
        duration: `${1.8 + (i % 3) * 0.4}s`,
        color: i % 2 === 0 ? "#6366f1" : "#8b5cf6",
      })),
    []
  );

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => onDone?.(), 3200);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute premium-celebration-star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
            background: `radial-gradient(circle, ${s.color}, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
