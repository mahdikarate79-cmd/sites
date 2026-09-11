"use client";

import { TelegramStar } from "@/components/ui/TelegramStar";
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
          <TelegramStar size="lg" />
          <span className="text-2xl font-bold text-gold">{stars}</span>
        </div>
        <p className="text-sm text-text-muted mb-5">برای مشاهده این رسانه، Stars ارسال کنید</p>
        <button onClick={handlePay} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-semibold text-sm mb-2">
          پرداخت {stars} ⭐
        </button>
        <button onClick={onClose} className="w-full py-2 text-sm text-text-muted">لغو</button>
      </div>
    </div>
  );
}
