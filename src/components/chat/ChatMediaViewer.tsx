"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Download, Reply, Forward } from "lucide-react";
import { ChatMessage, User } from "@/lib/types";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";
import { lockScroll, unlockScroll } from "@/lib/utils/scrollLock";
import { StarsUnlockAnimation } from "./StarsUnlockAnimation";
import { cn } from "@/lib/utils/cn";

export interface ViewerMedia {
  url: string;
  type: "image" | "video" | "gif";
  rotation?: number;
  mirrored?: boolean;
}

interface ChatMediaViewerProps {
  open: boolean;
  message: ChatMessage;
  media: ViewerMedia;
  sender: User;
  isMe: boolean;
  paidLocked: boolean;
  tempRestricted: boolean;
  isViewOnce: boolean;
  timerSeconds?: string;
  timerRemaining?: number | null;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onSave: () => void;
  onPay: () => void;
  showUnlockAnimation: boolean;
  onUnlockAnimationComplete: () => void;
}

function formatViewerDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatMediaViewer({
  open,
  message,
  media,
  sender,
  isMe,
  paidLocked,
  tempRestricted,
  isViewOnce,
  timerSeconds,
  timerRemaining,
  onClose,
  onReply,
  onForward,
  onSave,
  onPay,
  showUnlockAnimation,
  onUnlockAnimationComplete,
}: ChatMediaViewerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  if (!open) return null;

  const transform = [
    media.rotation ? `rotate(${media.rotation}deg)` : "",
    media.mirrored ? "scaleX(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const canSave = !tempRestricted && !paidLocked && !isViewOnce;
  const canForward = !tempRestricted && !isViewOnce;
  const canReply = true;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <header className="shrink-0 flex items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 bg-black/60">
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{sender.displayName}</p>
          <p className="text-[11px] text-white/60">{formatViewerDate(message.createdAt)}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-full hover:bg-white/10"
            aria-label="More"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#1c1c1e] border border-white/10 rounded-xl py-1 shadow-xl z-10">
              <button
                type="button"
                disabled={!canSave}
                onClick={() => { if (canSave) { onSave(); setMenuOpen(false); } }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-sm text-white",
                  canSave ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4" /> Save to gallery
              </button>
              <button
                type="button"
                disabled={!canReply}
                onClick={() => { onReply(); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/10"
              >
                <Reply className="w-4 h-4" /> Reply
              </button>
              <button
                type="button"
                disabled={!canForward}
                onClick={() => { if (canForward) { onForward(); setMenuOpen(false); } }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-sm text-white",
                  canForward ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed"
                )}
              >
                <Forward className="w-4 h-4" /> Forward
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center min-h-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {paidLocked && !showUnlockAnimation ? (
          <button type="button" onClick={onPay} className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden">
            <Image src={media.url} alt="" fill className="object-cover blur-2xl scale-110" unoptimized />
            <div className="spoiler-dots absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="px-5 py-4 rounded-2xl glass-pill flex flex-col items-center gap-2">
                <TelegramStarIcon variant="donate" size={32} />
                <span className="text-lg font-semibold text-white tabular-nums">{formatStars(message.paidStars ?? 0)}</span>
                <span className="text-xs text-white/80">Tap to unlock</span>
              </div>
            </div>
          </button>
        ) : media.type === "video" ? (
          <video
            src={media.url}
            className="max-h-full max-w-full object-contain"
            style={{ transform }}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={media.url}
              alt=""
              fill
              className="object-contain"
              style={{ transform }}
              unoptimized
              priority
            />
          </div>
        )}

        {showUnlockAnimation && <StarsUnlockAnimation onComplete={onUnlockAnimationComplete} />}

        {timerSeconds && timerRemaining !== null && timerRemaining !== undefined && !paidLocked && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium tabular-nums">
            {timerRemaining}s
          </div>
        )}

        {isViewOnce && !isMe && !paidLocked && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white/80 text-[11px]">
            View once — closes when you leave
          </div>
        )}
      </div>
    </div>
  );
}
