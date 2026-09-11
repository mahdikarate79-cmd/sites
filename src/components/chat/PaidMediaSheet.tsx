"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";

interface PaidMediaSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (stars: number) => void;
}

export function PaidMediaSheet({ open, onClose, onConfirm }: PaidMediaSheetProps) {
  const [amount, setAmount] = useState(50);

  return (
    <BottomSheet open={open} onClose={onClose} title="Paid media">
      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-text-muted">Paid media</span>
          <TelegramStarIcon variant="post" size={20} />
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          min={1}
          max={10000}
          className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-lg font-medium outline-none mb-4"
        />
        <p className="text-xs text-text-muted mb-4">
          Recipient will see a spoiler until they pay.
        </p>
        <button
          onClick={() => onConfirm(amount)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium text-sm"
        >
          Set amount
        </button>
      </div>
    </BottomSheet>
  );
}
