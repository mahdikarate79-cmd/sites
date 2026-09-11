"use client";

import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";

interface StarsSliderProps {
  value: number;
  min?: number;
  max?: number;
  topThreshold?: number;
  onChange: (value: number) => void;
}

export function StarsSlider({ value, min = 1, max = 10000, topThreshold = 0, onChange }: StarsSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const markerPercent = topThreshold > 0 ? ((topThreshold + 1) / (max - min)) * 100 : null;

  return (
    <div className="relative pt-12 pb-2 px-1">
      <div
        className="absolute top-0 z-10 pointer-events-none transition-[left] duration-75 ease-out"
        style={{ left: `clamp(28px, ${percent}%, calc(100% - 28px))`, transform: "translateX(-50%)" }}
      >
        <div className="relative">
          <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gold shadow-sm">
            <TelegramStarIcon variant="donate" size={16} />
            <span className="text-sm text-black/80 tabular-nums font-normal">{formatStars(value)}</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2 h-2 bg-gold rotate-45" />
        </div>
      </div>

      <div className="relative h-3 rounded-full overflow-visible glass-pill">
        <div className="absolute inset-0 rounded-full bg-gold/10" />
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-[width] duration-75 ease-out"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#c99a00]/70 to-[#ffd966]" />
        </div>
        {markerPercent !== null && markerPercent <= 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
            style={{ left: `clamp(0%, ${markerPercent}%, 100%)`, transform: "translate(-50%, -50%)" }}
          >
            <span className="text-[10px] text-gold font-medium mb-6 whitespace-nowrap">Top</span>
            <div className="w-0.5 h-5 bg-gold/80 rounded-full" />
          </div>
        )}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none z-10 transition-[left] duration-75 ease-out"
          style={{ left: `calc(${percent}% - 6px)` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute left-0 right-0 w-full opacity-0 cursor-pointer z-30"
        style={{ top: "48px", height: "20px" }}
        aria-label="Stars amount"
      />
    </div>
  );
}
