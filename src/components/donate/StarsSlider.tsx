"use client";

import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { MIN_STARS_PAYMENT } from "@/lib/constants/stars";

interface StarsSliderProps {
  value: number;
  min?: number;
  max?: number;
  topThreshold?: number;
  onChange: (value: number) => void;
  compact?: boolean;
  wide?: boolean;
}

export function StarsSlider({ value, min = MIN_STARS_PAYMENT, max = 10000, topThreshold = 0, onChange, compact, wide }: StarsSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn(
      compact ? "relative pt-11 pb-2" : "relative pt-14 pb-3 px-1",
      wide ? "px-0 -mx-1" : compact ? "px-1" : undefined
    )}>
      <div
        className="absolute top-0 z-10 pointer-events-none transition-[left] duration-75 ease-out"
        style={{ left: `clamp(28px, ${percent}%, calc(100% - 28px))`, transform: "translateX(-50%)" }}
      >
        <div className="relative">
          {!compact && (
            <div className="absolute -inset-2 pointer-events-none">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-gold/50 animate-[gold-sparkle_2s_ease-in-out_infinite]"
                  style={{ top: `${30 + i * 20}%`, left: `${20 + i * 40}%`, animationDelay: `${i * 0.5}s` }}
                />
              ))}
            </div>
          )}
          <div className="relative flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-gold">
            <TelegramStarIcon variant="donate" size={compact ? 15 : 18} />
            <span className="text-sm text-white tabular-nums font-medium">{formatStars(value)}</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gold rotate-45" />
        </div>
      </div>

      <div className={cn("relative rounded-full overflow-visible", wide ? "h-3.5" : "h-3")}>
        <div className="absolute inset-0 rounded-full bg-[#2a2a2a] border border-white/5" />
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-[width] duration-75 ease-out"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#b8860b] via-[#e8b923] to-[#ffd966]" />
        </div>
        {topThreshold > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gold tracking-wider pointer-events-none">
            TOP
          </span>
        )}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow pointer-events-none z-10 transition-[left] duration-75 ease-out"
          style={{ left: `calc(${percent}% - 7px)` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute left-0 right-0 w-full opacity-0 cursor-pointer z-30"
        style={{ top: compact ? "40px" : "52px", height: "20px" }}
        aria-label="Stars amount"
      />
    </div>
  );
}
