"use client";

import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/utils/format";
import { TelegramStarIcon } from "./TelegramStarIcon";

interface DonateButtonProps {
  total: number;
  donated?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  showCount?: boolean;
  vertical?: boolean;
}

export function DonateButton({
  total,
  donated,
  onClick,
  size = "md",
  showCount = true,
  vertical = false,
}: DonateButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-full transition-all duration-200",
        vertical ? "flex-col gap-0.5 p-1" : "gap-1.5 pl-1.5 pr-2.5 py-1",
        "bg-gold/12 border backdrop-blur-sm",
        donated ? "border-gold/55 shadow-[0_0_0_1px_rgba(232,185,35,0.15)]" : "border-gold/25 hover:border-gold/40 hover:bg-gold/16"
      )}
      aria-label="Donate Stars"
    >
      <span className="absolute -top-0.5 -right-0.5 text-[4px] text-gold/70 animate-[gold-sparkle_2s_ease-in-out_infinite] pointer-events-none">✦</span>
      <span className="absolute -bottom-0.5 left-1 text-[3px] text-gold/50 animate-[gold-sparkle_2.5s_ease-in-out_infinite_0.5s] pointer-events-none">✦</span>
      <span className="absolute top-0 left-2 text-[3px] text-gold/40 animate-[gold-sparkle_3s_ease-in-out_infinite_1s] pointer-events-none">✦</span>

      <span className={cn("relative flex items-center justify-center rounded-full bg-gold/15", size === "sm" ? "w-6 h-6" : "w-7 h-7")}>
        <TelegramStarIcon variant="post" size={size === "sm" ? 14 : 16} />
      </span>

      {showCount && (
        <span className={cn("font-medium text-gold tabular-nums", size === "sm" ? "text-[10px]" : "text-xs")}>
          {total > 0 ? formatCount(total) : "0"}
        </span>
      )}
    </button>
  );
}
