"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Download, Reply, Forward, ChevronLeft, ChevronRight } from "lucide-react";
import { ChatMessage, User } from "@/lib/types";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { formatStars } from "@/lib/utils/format";
import { lockScroll, unlockScroll } from "@/lib/utils/scrollLock";
import { StarsUnlockAnimation } from "./StarsUnlockAnimation";
import { SpoilerDots } from "@/components/ui/SpoilerDots";
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
  album?: ViewerMedia[];
  albumIndex?: number;
  onAlbumIndexChange?: (index: number) => void;
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

function mediaTransform(media: ViewerMedia) {
  const parts: string[] = [];
  if (media.rotation) parts.push(`rotate(${media.rotation}deg)`);
  if (media.mirrored) parts.push("scaleX(-1)");
  return parts.length ? parts.join(" ") : undefined;
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
  album,
  albumIndex = 0,
  onAlbumIndexChange,
}: ChatMediaViewerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const albumItems = album && album.length > 0 ? album : [media];
  const currentMedia = albumItems[albumIndex] ?? media;
  const hasAlbum = albumItems.length > 1;

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

  const goAlbum = (dir: -1 | 1) => {
    if (!onAlbumIndexChange || animating) return;
    const next = albumIndex + dir;
    if (next < 0 || next >= albumItems.length) return;
    setAnimating(true);
    setSlideOffset(dir * -100);
    setTimeout(() => {
      onAlbumIndexChange(next);
      setSlideOffset(0);
      setAnimating(false);
    }, 220);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasAlbum) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) goAlbum(1);
    else if (diff < -50) goAlbum(-1);
  };

  if (!open) return null;

  const transform = mediaTransform(currentMedia);
  const canSave = !tempRestricted && !paidLocked && !isViewOnce;
  const canForward = !tempRestricted && !isViewOnce;

  const renderMediaContent = (item: ViewerMedia) => {
    if (item.type === "video") {
      return (
        <video
          src={item.url}
          className="max-h-full max-w-full object-contain"
          style={{ transform: mediaTransform(item) }}
          controls
          autoPlay
          playsInline
        />
      );
    }
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={item.url}
          alt=""
          fill
          className="object-contain"
          style={{ transform: mediaTransform(item) }}
          unoptimized
          priority
        />
      </div>
    );
  };

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
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-full hover:bg-white/10" aria-label="More">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#1c1c1e] border border-white/10 rounded-xl py-1 shadow-xl z-10">
              <button type="button" disabled={!canSave} onClick={() => { if (canSave) { onSave(); setMenuOpen(false); } }} className={cn("flex items-center gap-3 w-full px-4 py-3 text-sm text-white", canSave ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed")}>
                <Download className="w-4 h-4" /> Save to gallery
              </button>
              <button type="button" onClick={() => { onReply(); setMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/10">
                <Reply className="w-4 h-4" /> Reply
              </button>
              <button type="button" disabled={!canForward} onClick={() => { if (canForward) { onForward(); setMenuOpen(false); } }} className={cn("flex items-center gap-3 w-full px-4 py-3 text-sm text-white", canForward ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed")}>
                <Forward className="w-4 h-4" /> Forward
              </button>
            </div>
          )}
        </div>
      </header>

      <div
        className="flex-1 relative flex items-center justify-center min-h-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {paidLocked && !showUnlockAnimation ? (
          <button type="button" onClick={onPay} className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden">
            <Image src={currentMedia.url} alt="" fill className="object-cover blur-2xl scale-110" unoptimized />
            <SpoilerDots />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="px-5 py-4 rounded-2xl glass-pill flex flex-col items-center gap-2">
                <TelegramStarIcon variant="post" size={32} />
                <span className="text-lg font-semibold text-white tabular-nums">{formatStars(message.paidStars ?? 0)}</span>
                <span className="text-xs text-white/80">Tap to unlock</span>
              </div>
            </div>
          </button>
        ) : (
          <div
            className="relative w-full h-full transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${slideOffset}%)` }}
          >
            {renderMediaContent(currentMedia)}
          </div>
        )}

        {hasAlbum && !paidLocked && (
          <>
            {albumIndex > 0 && (
              <button type="button" onClick={() => goAlbum(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white" aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {albumIndex < albumItems.length - 1 && (
              <button type="button" onClick={() => goAlbum(1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white" aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs tabular-nums">
              {albumIndex + 1} / {albumItems.length}
            </div>
          </>
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
