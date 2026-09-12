"use client";

import { useEffect } from "react";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";

interface StarsUnlockAnimationProps {
  onComplete: () => void;
}

const BURSTS = Array.from({ length: 16 }, (_, i) => ({
  angle: i * 22.5,
  delay: i * 0.02,
  scale: 0.5 + (i % 4) * 0.15,
  distance: 60 + (i % 3) * 25,
}));

export function StarsUnlockAnimation({ onComplete }: StarsUnlockAnimationProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 850);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 pointer-events-none overflow-hidden">
      {BURSTS.map(({ angle, delay, scale, distance }) => (
        <span
          key={angle}
          className="absolute stars-burst-fast"
          style={{
            "--angle": `${angle}deg`,
            "--delay": `${delay}s`,
            "--scale": scale,
            "--distance": `${distance}px`,
          } as React.CSSProperties}
        >
          <TelegramStarIcon variant="post" size={22} />
        </span>
      ))}
      <div className="absolute stars-pulse-fast">
        <TelegramStarIcon variant="post" size={40} />
      </div>
    </div>
  );
}
