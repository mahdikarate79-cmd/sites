import { cn } from "@/lib/utils/cn";

interface PremiumParticlesProps {
  count?: number;
  className?: string;
  animated?: boolean;
}

const positions = [
  { top: "-3px", left: "-5px" },
  { top: "-4px", right: "-4px" },
  { bottom: "-2px", left: "0px" },
  { bottom: "-3px", right: "-2px" },
  { top: "40%", left: "-7px" },
  { top: "30%", right: "-6px" },
];

export function PremiumParticles({ count = 3, className, animated = false }: PremiumParticlesProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)} aria-hidden>
      {positions.slice(0, count).map((pos, i) => (
        <span
          key={i}
          className={cn(
            "absolute text-[5px] text-[#8b5cf6] opacity-50",
            animated && "animate-[premium-burst_0.6s_ease-out_forwards]"
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
