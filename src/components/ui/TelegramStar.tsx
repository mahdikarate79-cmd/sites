import { cn } from "@/lib/utils/cn";
import { StarParticles } from "./StarParticles";

interface TelegramStarProps {
  size?: "sm" | "md" | "lg";
  showParticles?: boolean;
  className?: string;
}

export function TelegramStar({ size = "md", showParticles = false, className }: TelegramStarProps) {
  const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };

  return (
    <span className={cn("relative inline-flex", className)}>
      {showParticles && <StarParticles count={4} />}
      <svg
        viewBox="0 0 24 24"
        className={cn(sizes[size], "text-gold")}
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
      </svg>
    </span>
  );
}
