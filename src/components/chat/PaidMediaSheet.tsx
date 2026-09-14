"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { starsToUsd, formatUsd, MIN_STARS_PAYMENT, MAX_PAID_MEDIA_STARS } from "@/lib/constants/stars";

interface PaidMediaSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (stars: number) => void;
}

export function PaidMediaSheet({ open, onClose, onConfirm }: PaidMediaSheetProps) {
  const [input, setInput] = useState(String(MIN_STARS_PAYMENT));

  const stars = Math.max(0, parseInt(input, 10) || 0);
  const valid = stars >= MIN_STARS_PAYMENT && stars <= MAX_PAID_MEDIA_STARS;
  const usd = starsToUsd(stars);

  const handleChange = (value: string) => {
    if (value === "") {
      setInput("");
      return;
    }
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (Number.isNaN(num)) return;
    setInput(String(Math.min(MAX_PAID_MEDIA_STARS, Math.max(0, num))));
  };

  const handleConfirm = () => {
    if (!valid) return;
    onConfirm(stars);
    setInput("100");
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-4 pb-6 pt-2">
        <h2 className="text-lg font-semibold mb-5">Paid Content</h2>

        <div className="relative mb-2">
          <label className="absolute -top-2.5 left-3 px-1 text-xs text-[#8b5cf6] bg-bg z-10">
            Enter unlock cost
          </label>
          <div className="flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-[#8b5cf6]/40 bg-surface/50">
            <TelegramStarIcon variant="post" size={28} />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 text-2xl font-medium outline-none bg-transparent min-w-0 tabular-nums font-sans"
              style={{ fontVariantNumeric: "lining-nums" }}
              aria-label="Stars amount"
            />
            <span className="text-sm text-text-muted shrink-0 tabular-nums font-sans">≈ {formatUsd(usd)}</span>
          </div>
        </div>

        {stars > MAX_PAID_MEDIA_STARS && (
          <p className="text-xs text-like mb-2">Maximum is {MAX_PAID_MEDIA_STARS.toLocaleString("en-US")} Stars</p>
        )}

        <p className="text-xs text-text-muted leading-relaxed mb-6 px-1">
          Users will have to transfer this amount of Stars to view this media.{" "}
          <button type="button" className="text-[#3b82f6]">Learn more</button>
        </p>

        <button
          onClick={handleConfirm}
          disabled={!valid}
          className="w-full py-3.5 rounded-full bg-[#3b82f6] text-white font-semibold text-sm disabled:opacity-40"
        >
          Make This Media Paid
        </button>
      </div>
    </BottomSheet>
  );
}
