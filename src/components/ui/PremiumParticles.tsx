import { cn } from "@/lib/utils/cn";

interface PremiumParticlesProps {
  count?: number;
  className?: string;
  animated?: boolean;
  centered?: boolean;
}

const centeredPositions = [
  { top: "2px", left: "50%", marginLeft: "-8px" },
  { top: "50%", left: "2px", marginTop: "-3px" },
  { top: "50%", right: "2px", marginTop: "-3px" },
  { bottom: "4px", left: "50%", marginLeft: "4px" },
];

const spreadPositions = [
  { top: "4px", left: "12%" },
  { top: "6px", right: "15%" },
  { bottom: "6px", left: "20%" },
  { bottom: "4px", right: "18%" },
  { top: "50%", left: "6%" },
  { top: "45%", right: "8%" },
];

export function PremiumParticles({ count = 3, className, animated = false, centered = false }: PremiumParticlesProps) {
  const positions = centered ? centeredPositions : spreadPositions;

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)} aria-hidden>
      {positions.slice(0, count).map((pos, i) => (
        <span
          key={i}
          className={cn(
            "absolute text-[6px] text-[#8b5cf6]",
            animated ? "animate-[premium-burst_0.6s_ease-out_forwards]" : "opacity-60"
          )}
          style={pos}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

export function PremiumBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-sm text-[#8b5cf6] animate-[burst-out_0.5s_ease-out_forwards]"
          style={{
            transform: `rotate(${i * 45}deg) translateY(-20px)`,
            animationDelay: `${i * 0.02}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

export function HeaderStars() {
  const stars = [
    { top: "8px", left: "18%" },
    { top: "12px", right: "22%" },
    { top: "50%", left: "8%" },
    { bottom: "10px", right: "12%" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {stars.map((pos, i) => (
        <span
          key={i}
          className="absolute text-[5px] text-[#8b5cf6] opacity-45"
          style={pos}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
