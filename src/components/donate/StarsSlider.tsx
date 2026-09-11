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

  return (
    <div className="relative pt-14 pb-3 px-1">
      {/* Amount bubble */}
      <div
        className="absolute top-0 z-10 pointer-events-none transition-[left] duration-75 ease-out"
        style={{ left: `clamp(32px, ${percent}%, calc(100% - 32px))`, transform: "translateX(-50%)" }}
      >
        <div className="relative">
          <div className="absolute -inset-3 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-gold/60 animate-[gold-sparkle_2s_ease-in-out_infinite]"
                style={{ top: `${20 + i * 12}%`, left: `${10 + i * 30}%`, animationDelay: `${i * 0.4}s` }}
              />
            ))}
          </div>
          <div className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#e8b923]">
            <TelegramStarIcon variant="donate" size={18} />
            <span className="text-sm text-black/85 tabular-nums font-medium">{formatStars(value)}</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2.5 h-2.5 bg-[#e8b923] rotate-45" />
        </div>
      </div>

      {/* Track */}
      <div className="relative h-3.5 rounded-full overflow-visible">
        <div className="absolute inset-0 rounded-full bg-[#2a2a2a] border border-white/5" />
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-[width] duration-75 ease-out"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#b8860b] via-[#e8b923] to-[#ffd966]" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:8px_8px]" />
        </div>
        {topThreshold > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gold tracking-wider pointer-events-none">
            TOP
          </span>
        )}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md pointer-events-none z-10 transition-[left] duration-75 ease-out"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute left-0 right-0 w-full opacity-0 cursor-pointer z-30"
        style={{ top: "52px", height: "24px" }}
        aria-label="Stars amount"
      />
    </div>
  );
}
