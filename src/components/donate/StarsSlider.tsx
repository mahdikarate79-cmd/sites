"use client";

import { useRef } from "react";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";

interface StarsSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function StarsSlider({ value, min = 1, max = 10000, onChange }: StarsSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative pt-12 pb-2 px-1">
      {/* Bubble attached to thumb */}
      <div
        className="absolute top-0 z-10 pointer-events-none transition-[left] duration-75 ease-out"
        style={{ left: `clamp(28px, ${percent}%, calc(100% - 28px))`, transform: "translateX(-50%)" }}
      >
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gold/20 blur-sm animate-[gold-pulse_2s_ease-in-out_infinite]" />
          <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gold border border-gold/80 shadow-sm">
            <span className="absolute -top-1 -right-1 text-[5px] text-white/80 animate-[gold-sparkle_1.5s_ease-in-out_infinite]">✦</span>
            <span className="absolute -bottom-0.5 -left-1 text-[4px] text-white/60 animate-[gold-sparkle_2s_ease-in-out_infinite_0.3s]">✦</span>
            <TelegramStarIcon variant="donate" size={16} />
            <span className="text-sm text-black/85 tabular-nums">{formatStars(value)}</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2 h-2 bg-gold rotate-45" />
        </div>
      </div>

      {/* Track */}
      <div ref={trackRef} className="relative h-3.5 rounded-full overflow-hidden glass-nav border border-gold/15">
        <div className="absolute inset-0 bg-gold/8" />
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-[width] duration-75 ease-out"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#E8B923] to-[#FFD966]" />
          <div className="absolute inset-0 opacity-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-[5px] text-white/70 animate-[gold-sparkle_2.5s_ease-in-out_infinite]"
                style={{ left: `${8 + i * 8}%`, top: `${20 + (i % 3) * 20}%`, animationDelay: `${i * 0.15}s` }}
              >
                ✦
              </span>
            ))}
          </div>
        </div>
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-white/80 pointer-events-none transition-[left] duration-75 ease-out z-10"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        style={{ top: "48px", height: "20px" }}
        aria-label="Stars amount"
      />
    </div>
  );
}
