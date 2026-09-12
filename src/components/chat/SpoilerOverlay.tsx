"use client";

import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { SpoilerDots } from "@/components/ui/SpoilerDots";
import { formatStars } from "@/lib/utils/format";
import { useAssetPath } from "@/lib/hooks/useAssetPath";
import { cn } from "@/lib/utils/cn";

interface SpoilerOverlayProps {
  stars?: number;
  label?: string;
  variant?: "default" | "temp";
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function SpoilerOverlay({ stars, label, variant = "default", onClick, className, compact }: SpoilerOverlayProps) {
  const isTemp = variant === "temp";
  const fireSrc = useAssetPath("/icons/temp-fire.png");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("absolute inset-0 flex items-center justify-center overflow-hidden", className)}
      aria-label={stars ? `Unlock for ${stars} stars` : isTemp ? "Tap to view temporary media" : label ?? "Tap to view"}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" aria-hidden />
      <SpoilerDots />
      {isTemp ? (
        <div className="relative z-[1] flex items-center justify-center w-14 h-14">
          <img
            src={fireSrc}
            alt=""
            width={48}
            height={48}
            className="flame-live object-contain drop-shadow-md"
            draggable={false}
          />
        </div>
      ) : (stars !== undefined || label) ? (
        <div className={cn("relative z-[1] px-3 py-2 rounded-full glass-pill flex items-center gap-1.5", compact && "px-2 py-1")}>
          {stars !== undefined && (
            <>
              <TelegramStarIcon variant="post" size={compact ? 14 : 18} />
              <span className={cn("font-semibold text-white tabular-nums", compact ? "text-xs" : "text-sm")}>
                {formatStars(stars)}
              </span>
            </>
          )}
          {!stars && label && (
            <span className={cn("text-white/90 font-medium", compact ? "text-[10px]" : "text-xs")}>{label}</span>
          )}
        </div>
      ) : null}
    </button>
  );
}

export function PaidPriceBadge({ stars, className }: { stars: number; className?: string }) {
  return (
    <div className={cn("absolute top-1.5 right-1.5 z-[2] px-1.5 py-0.5 rounded-full glass-pill flex items-center gap-1", className)}>
      <TelegramStarIcon variant="post" size={12} />
      <span className="text-[10px] font-semibold text-white tabular-nums">{formatStars(stars)}</span>
    </div>
  );
}
