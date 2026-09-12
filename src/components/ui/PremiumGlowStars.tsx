"use client";

import { cn } from "@/lib/utils/cn";

const POSITIONS = [
  { top: "-2px", left: "50%", marginLeft: "-3px" },
  { top: "20%", left: "-4px" },
  { top: "20%", right: "-4px" },
  { bottom: "15%", left: "-3px" },
  { bottom: "15%", right: "-3px" },
  { bottom: "-2px", left: "35%" },
];

export function PremiumGlowStars({ className }: { className?: string }) {
  return (
    <span className={cn("absolute -inset-2 pointer-events-none", className)} aria-hidden>
      {POSITIONS.map((pos, i) => (
        <span
          key={i}
          className="absolute text-[5px] premium-glow-star"
          style={{ ...pos, animationDelay: `${i * 0.35}s` }}
        >
          ✦
        </span>
      ))}
    </span>
  );
}

export function DonateStarGlow({ className }: { className?: string }) {
  const positions = [
    { top: "-3px", left: "50%", marginLeft: "-3px" },
    { top: "50%", left: "-5px", marginTop: "-3px" },
    { top: "50%", right: "-5px", marginTop: "-3px" },
    { bottom: "-3px", left: "50%", marginLeft: "2px" },
  ];

  return (
    <span className={cn("absolute -inset-1.5 pointer-events-none", className)} aria-hidden>
      {positions.map((pos, i) => (
        <span
          key={i}
          className="absolute text-[5px] donate-glow-star"
          style={{ ...pos, animationDelay: `${i * 0.28}s` }}
        >
          ✦
        </span>
      ))}
    </span>
  );
}
