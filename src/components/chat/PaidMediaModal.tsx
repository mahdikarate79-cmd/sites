"use client";

import { useState } from "react";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/components/ui/ToastProvider";
import { createPaidMediaInvoice, openTelegramInvoice } from "@/lib/api/payments";

interface PaidMediaModalProps {
  stars: number;
  chatId: string;
  messageId: string;
  recipientId: string;
  onClose: () => void;
  onUnlock: () => void;
}

export function PaidMediaModal({ stars, chatId, messageId, recipientId, onClose, onUnlock }: PaidMediaModalProps) {
  const { unlockPaidMediaMessage } = usePrototype();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (paying || !isAuthenticated) return;
    setPaying(true);
    try {
      const invoice = await createPaidMediaInvoice(chatId, messageId, recipientId, stars);
      if (!invoice.invoiceUrl) {
        showToast("Payment unavailable");
        setPaying(false);
        return;
      }
      const opened = openTelegramInvoice(invoice.invoiceUrl, (status) => {
        if (status === "paid") {
          unlockPaidMediaMessage(chatId, messageId);
          onUnlock();
          onClose();
        } else if (status === "failed") {
          showToast("Payment failed");
        }
        setPaying(false);
      });
      if (!opened) {
        showToast("Open in Telegram to pay with Stars");
        setPaying(false);
      }
    } catch {
      showToast("Payment failed");
      setPaying(false);
    }
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
        <button onClick={handlePay} disabled={paying} className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-medium text-sm mb-2 disabled:opacity-50">
          {paying ? "Opening invoice…" : `Pay ${stars} Stars`}
        </button>
        <button onClick={onClose} className="w-full py-2 text-sm text-text-muted">Cancel</button>
      </div>
    </div>
  );
}
