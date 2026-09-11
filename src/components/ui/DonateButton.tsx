"use client";

import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/utils/format";
import { TelegramStar } from "./TelegramStar";

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
        "relative flex items-center gap-1 rounded-full transition-all",
        vertical ? "flex-col gap-0.5 p-1" : "px-2.5 py-1",
        "bg-gold/10 border",
        donated ? "border-gold/60" : "border-gold/25",
        "hover:bg-gold/15"
      )}
      aria-label="Donate Stars"
    >
      <TelegramStar size={size === "sm" ? "sm" : "md"} showParticles={size !== "sm"} />
      {showCount && total > 0 && (
        <span className={cn("font-semibold text-gold", size === "sm" ? "text-[10px]" : "text-xs")}>
          {formatCount(total)}
        </span>
      )}
    </button>
  );
}
