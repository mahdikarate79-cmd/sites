import { cn } from "@/lib/utils/cn";

interface TelegramStarProps {
  size?: "xs" | "sm" | "md" | "lg";
  showParticles?: boolean;
  className?: string;
}

const sizes = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

export function TelegramStar({ size = "md", showParticles = false, className }: TelegramStarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {showParticles && (
        <>
          <span className="absolute -top-1 -left-1 text-[4px] text-gold/60">✦</span>
          <span className="absolute -top-1.5 right-0 text-[3px] text-gold/50">✦</span>
          <span className="absolute -bottom-0.5 -right-0.5 text-[4px] text-gold/40">✦</span>
        </>
      )}
      <svg viewBox="0 0 24 24" className={cn(sizes[size])} aria-hidden>
        <defs>
          <linearGradient id="tg-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE566" />
            <stop offset="50%" stopColor="#E8B923" />
            <stop offset="100%" stopColor="#C99A00" />
          </linearGradient>
        </defs>
        <path
          d="M12 1.5l2.8 8.6h9l-7.2 5.2 2.8 8.6L12 18.7 4.6 24l2.8-8.6-7.2-5.2h9L12 1.5z"
          fill="url(#tg-star-grad)"
        />
        <path
          d="M12 3.5l2.2 6.8h7.1l-5.7 4.1 2.2 6.8L12 16.8l-5.8 4.4 2.2-6.8-5.7-4.1h7.1L12 3.5z"
          fill="#FFF5A0"
          opacity="0.3"
        />
      </svg>
    </span>
  );
}
