"use client";

import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";

interface LockedMediaOverlayProps {
  stars?: number;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function LockedMediaOverlay({ stars, label = "Tap to unlock", onClick, className }: LockedMediaOverlayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xl ${className ?? ""}`}
    >
      <div className="px-4 py-3 rounded-2xl glass-pill flex items-center gap-2">
        <TelegramStarIcon variant="donate" size={20} />
        {stars !== undefined && (
          <span className="text-sm font-semibold text-white tabular-nums">{formatStars(stars)}</span>
        )}
      </div>
      <span className="absolute bottom-3 text-[11px] text-white/80">{label}</span>
    </button>
  );
}
