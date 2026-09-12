"use client";

import { Send } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { openTelegramBot } from "@/lib/telegram/miniApp";
import { useTheme } from "@/lib/hooks/useTheme";

interface TelegramGateModalProps {
  open: boolean;
  onClose: () => void;
}

export function TelegramGateModal({ open, onClose }: TelegramGateModalProps) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  return (
    <BottomSheet open={open} onClose={onClose} title="Telegram Mini App">
      <div className="px-5 pb-6 text-center">
        <div
          className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(41,168,229,0.2), rgba(107,114,128,0.15))"
              : "linear-gradient(135deg, rgba(41,168,229,0.15), rgba(255,255,255,0.9))",
            borderColor: isDark ? "rgba(41,168,229,0.35)" : "rgba(41,168,229,0.25)",
          }}
        >
          <Send className="w-8 h-8 text-[#29a8e5]" />
        </div>

        <h3 className="text-base font-semibold mb-2">Open in Telegram</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          To use this feature — likes, comments, messages, Stars, and more — open Sheytoni in the Telegram Mini App.
        </p>

        <button
          type="button"
          onClick={() => {
            openTelegramBot();
            onClose();
          }}
          className="w-full py-3 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-[#29a8e5] via-[#3b82f6] to-[#8b5cf6] shadow-lg shadow-[#6366f1]/20"
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
