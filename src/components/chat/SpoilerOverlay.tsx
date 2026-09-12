"use client";

import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface SpoilerOverlayProps {
  stars?: number;
  label?: string;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function SpoilerOverlay({ stars, label, onClick, className, compact }: SpoilerOverlayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("absolute inset-0 flex items-center justify-center overflow-hidden", className)}
      aria-label={stars ? `Unlock for ${stars} stars` : label ?? "Tap to view"}
    >
      <div className="absolute inset-0 bg-black/25" aria-hidden />
      <div className="spoiler-dots absolute inset-0" aria-hidden />
      {(stars !== undefined || label) && (
        <div className={cn("relative z-[1] px-3 py-2 rounded-full glass-pill flex items-center gap-1.5", compact && "px-2 py-1")}>
          {stars !== undefined && (
            <>
              <TelegramStarIcon variant="donate" size={compact ? 14 : 18} />
              <span className={cn("font-semibold text-white tabular-nums", compact ? "text-xs" : "text-sm")}>
                {formatStars(stars)}
              </span>
            </>
          )}
          {!stars && label && (
            <span className={cn("text-white/90 font-medium", compact ? "text-[10px]" : "text-xs")}>{label}</span>
          )}
        </div>
      )}
    </button>
  );
}

export function PaidPriceBadge({ stars, className }: { stars: number; className?: string }) {
  return (
    <div className={cn("absolute top-1.5 right-1.5 z-[2] px-1.5 py-0.5 rounded-full glass-pill flex items-center gap-1", className)}>
      <TelegramStarIcon variant="donate" size={12} />
      <span className="text-[10px] font-semibold text-white tabular-nums">{formatStars(stars)}</span>
    </div>
  );
}
