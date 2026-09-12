"use client";

import { useEffect } from "react";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";

interface StarsUnlockAnimationProps {
  onComplete: () => void;
}

const BURSTS = Array.from({ length: 12 }, (_, i) => ({
  angle: i * 30,
  delay: i * 0.05,
  scale: 0.6 + (i % 3) * 0.2,
}));

export function StarsUnlockAnimation({ onComplete }: StarsUnlockAnimationProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2200);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 pointer-events-none">
      <div className="relative w-32 h-32">
        {BURSTS.map(({ angle, delay, scale }) => (
          <span
            key={angle}
            className="absolute left-1/2 top-1/2 stars-burst"
            style={{
              "--angle": `${angle}deg`,
              "--delay": `${delay}s`,
              "--scale": scale,
            } as React.CSSProperties}
          >
            <TelegramStarIcon variant="donate" size={28} className="text-gold drop-shadow-sm" />
          </span>
        ))}
        <div className="absolute inset-0 flex items-center justify-center stars-pulse">
          <TelegramStarIcon variant="donate" size={48} className="text-gold" />
        </div>
      </div>
    </div>
  );
}
