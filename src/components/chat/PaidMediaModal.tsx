"use client";

import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { usePrototype } from "@/lib/hooks/usePrototype";

interface PaidMediaModalProps {
  stars: number;
  onClose: () => void;
  onUnlock: () => void;
}

export function PaidMediaModal({ stars, onClose, onUnlock }: PaidMediaModalProps) {
  const { unlockPaidMedia } = usePrototype();

  const handlePay = () => {
    unlockPaidMedia(stars);
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <TelegramStarIcon variant="donate" size={28} />
          <span className="text-2xl font-medium text-gold">{stars}</span>
        </div>
        <p className="text-sm text-text-muted mb-5">Send Stars to view this media</p>
        <button onClick={handlePay} className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-medium text-sm mb-2">
          Pay {stars} Stars
        </button>
        <button onClick={onClose} className="w-full py-2 text-sm text-text-muted">Cancel</button>
      </div>
    </div>
  );
}
