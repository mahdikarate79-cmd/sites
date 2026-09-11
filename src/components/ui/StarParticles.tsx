import { cn } from "@/lib/utils/cn";

interface StarParticlesProps {
  count?: number;
  className?: string;
}

export function StarParticles({ count = 4, className }: StarParticlesProps) {
  const positions = [
    { top: "-2px", left: "-4px", delay: "0s" },
    { top: "-3px", right: "-3px", delay: "0.5s" },
    { bottom: "-2px", left: "2px", delay: "1s" },
    { bottom: "-3px", right: "-2px", delay: "1.5s" },
    { top: "50%", left: "-6px", delay: "0.8s" },
    { top: "50%", right: "-6px", delay: "1.2s" },
  ];

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {positions.slice(0, count).map((pos, i) => (
        <span
          key={i}
          className="absolute text-[6px] text-gold star-particle"
          style={{ ...pos, animationDelay: pos.delay }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
