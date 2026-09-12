"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { TelegramLogo } from "@/components/ui/TelegramLogo";
import { openTelegramBot } from "@/lib/telegram/miniApp";

interface TelegramGateModalProps {
  open: boolean;
  onClose: () => void;
}

export function TelegramGateModal({ open, onClose }: TelegramGateModalProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="" className="overflow-hidden">
      <div
        className="relative px-5 pt-2 pb-6 text-center -mx-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(34,158,217,0.18) 0%, transparent 55%), linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(0,0,0,0.98) 100%)",
        }}
      >
        <div className="flex justify-center items-center mb-5 mt-2">
          <TelegramLogo size={72} className="block shrink-0" />
        </div>

        <h3 className="text-lg font-semibold mb-2 text-[#2AABEE]">Telegram Mini App</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-[280px] mx-auto">
          To use this feature, please open Sheytoni through the Telegram Mini App.
        </p>

        <button
          type="button"
          onClick={() => {
            openTelegramBot();
            onClose();
          }}
          className="w-full py-3 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-[#2AABEE] to-[#229ED9] shadow-lg shadow-[#229ED9]/25"
        >
          Open in Telegram
        </button>

        <button type="button" onClick={onClose} className="w-full mt-3 py-2.5 text-sm text-text-muted">
          Continue browsing
        </button>
      </div>
    </BottomSheet>
  );
}
