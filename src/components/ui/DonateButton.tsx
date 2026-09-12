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

const ICON_PX = { sm: 18, md: 20 } as const;

export function DonateButton({
  total,
  donated,
  onClick,
  size = "md",
  showCount = true,
  vertical = false,
}: DonateButtonProps) {
  const iconSize = ICON_PX[size];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-full transition-all duration-200 glass-pill",
        vertical ? "flex-col gap-0.5 p-1.5" : "gap-1.5 pl-1 pr-2.5 py-1",
        donated ? "border-gold/50 bg-gold/8" : "border-gold/15 bg-gold/5 hover:bg-gold/8 hover:border-gold/25"
      )}
      aria-label="Donate Stars"
    >
      <span
        className="relative shrink-0 flex items-center justify-center overflow-hidden"
        style={{ width: iconSize, height: iconSize, minWidth: iconSize, minHeight: iconSize }}
      >
        <TelegramStarIcon variant="post" size={iconSize} />
      </span>
      {showCount && (
        <span className={cn("font-medium text-gold tabular-nums shrink-0", size === "sm" ? "text-[10px]" : "text-xs")}>
          {formatCount(total)}
        </span>
      )}
    </button>
  );
}
