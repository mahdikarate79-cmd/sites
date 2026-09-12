"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Heart, MessageCircle, Share2, MoreVertical,
  Volume2, VolumeX, Play, Minimize2, Bookmark, Flag, ThumbsDown, Maximize, Link2,
} from "lucide-react";
import { ReelItem } from "@/lib/utils/reels";
import { Avatar } from "@/components/ui/Avatar";
import { DonateButton } from "@/components/ui/DonateButton";
import { FollowButton } from "@/components/ui/FollowButton";
import { UserName } from "@/components/ui/UserName";
import { ShareChatPicker } from "@/components/chat/ShareChatPicker";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DonateModal } from "@/components/donate/DonateModal";
import { ReportModal } from "@/components/feed/ReportModal";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCount } from "@/lib/utils/format";
import { lockScroll, unlockScroll } from "@/lib/utils/scrollLock";
import { cn } from "@/lib/utils/cn";

interface ReelsViewerProps {
  open: boolean;
  onClose: () => void;
  items: ReelItem[];
  initialIndex: number;
}

export function ReelsViewer({ open, onClose, items, initialIndex }: ReelsViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [speed2x, setSpeed2x] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const { isLiked, toggleLike, getDonation, isFollowing, markInterested, markNotInterested, hidePost, toggleBookmark, isBookmarked } = usePrototype();
  const { showToast } = useToast();

  const item = items[index];
  const post = item?.post;
  const media = item?.media;
  const isVideo = media?.type === "video";

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
    setPaused(false);
    setProgress(0);
    lockScroll();
    return () => unlockScroll();
  }, [open, initialIndex]);

  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    videoRef.current.playbackRate = speed2x ? 2 : 1;
    if (paused) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [paused, speed2x, index, isVideo]);

  useEffect(() => {
    setProgress(0);
    const video = videoRef.current;
    if (!video || !isVideo) return;

    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [index, isVideo]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
      setPaused(false);
    }
  }, [index, items.length]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
      setPaused(false);
    }
  }, [index]);

  const handleVideoTap = (e: React.MouseEvent) => {
    if (!post || !isVideo) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-reel-ui]")) return;

    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const inCenter = relX > 0.2 && relX < 0.8;

    if (now - lastTap.current < 300 && inCenter) {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
      lastTap.current = 0;
      toggleLike(post.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 600);
      return;
    }

    lastTap.current = now;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (inCenter) setPaused((p) => !p);
      tapTimer.current = null;
    }, 280);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 30) goNext();
    else if (e.deltaY < -30) goPrev();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 60) goNext();
    else if (diff < -60) goPrev();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-reel-ui]")) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    if (relX <= 0.15 || relX >= 0.85) {
      holdTimer.current = setTimeout(() => setSpeed2x(true), 300);
    }
  };

  const handlePointerUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setSpeed2x(false);
  };

  if (!open || !post || !media) return null;

  const liked = isLiked(post.id);
  const bookmarked = isBookmarked(post.id);
  const donation = getDonation(post.id, { total: post.stars ?? 0, topDonators: post.topDonators ?? [] });
  const following = isFollowing(post.author.id);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://sheytoni.app/post/${post.id}`);
    showToast("Link copied");
    setMenuOpen(false);
  };

  const menuItems = [
    { icon: Bookmark, label: bookmarked ? "Unsave" : "Save", action: () => { toggleBookmark(post.id); setMenuOpen(false); } },
    { icon: Link2, label: "Copy link", action: copyLink },
    { icon: Flag, label: "Report", action: () => { setReportOpen(true); setMenuOpen(false); }, danger: true },
    { icon: Heart, label: "I like this", action: () => { markInterested(post); showToast("Added to interests"); setMenuOpen(false); } },
    { icon: ThumbsDown, label: "I don't like this", action: () => { markNotInterested(post); hidePost(post.id); onClose(); setMenuOpen(false); } },
    { icon: Maximize, label: "Fullscreen", action: () => { setFullscreen(true); setMenuOpen(false); } },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black" ref={containerRef}>
      {!fullscreen && (
        <>
          <button onClick={onClose} className="absolute top-4 left-4 z-20 p-2 safe-top" data-reel-ui aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-white drop-shadow" />
          </button>
          <button onClick={() => setMenuOpen(true)} className="absolute top-4 right-4 z-20 p-2 safe-top" data-reel-ui aria-label="More">
            <MoreVertical className="w-6 h-6 text-white drop-shadow" />
          </button>
        </>
      )}

      <div
        className="relative w-full h-dvh overflow-hidden"
        onClick={isVideo ? handleVideoTap : undefined}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateY(-${index * 100}%)` }}
        >
          {items.map((reelItem, i) => {
            const reelMedia = reelItem.media;
            const reelIsVideo = reelMedia.type === "video";
            return (
              <div key={`${reelItem.post.id}-${reelItem.mediaIndex}`} className="relative w-full h-dvh shrink-0">
                {reelIsVideo ? (
                  <video
                    ref={i === index ? videoRef : undefined}
                    src={reelMedia.url}
                    poster={reelMedia.thumbnail}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    muted={muted}
                    autoPlay={i === index}
                  />
                ) : (
                  <Image src={reelMedia.url} alt="" fill className="object-cover" priority={i === index} unoptimized />
                )}
              </div>
            );
          })}
        </div>

        {isVideo && paused && !fullscreen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
              className="mb-4 p-2 rounded-full bg-black/40 pointer-events-auto"
              data-reel-ui
            >
              {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
            <Play className="w-16 h-16 text-white fill-white opacity-80" />
          </div>
        )}

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <Heart className="w-24 h-24 text-like fill-like animate-[heart-burst_0.6s_ease-out]" />
          </div>
        )}

        {speed2x && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium z-30">
            2x
          </div>
        )}

        {!fullscreen && (
          <>
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10" data-reel-ui>
              <button onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }} className="flex flex-col items-center gap-0.5">
                <Heart className={cn("w-7 h-7", liked ? "text-like fill-like" : "text-white")} />
                <span className="text-white text-xs font-medium">{formatCount(post.likes)}</span>
              </button>
              <div onClick={(e) => { e.stopPropagation(); setDonateOpen(true); }}>
                <DonateButton total={donation.total} donated={donation.userDonated} onClick={() => setDonateOpen(true)} vertical size="sm" />
              </div>
              <button className="flex flex-col items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-medium">{formatCount(post.comments)}</span>
              </button>
              <button className="flex flex-col items-center gap-0.5" onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}>
                <Share2 className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-medium">{formatCount(post.shares)}</span>
              </button>
            </div>

            <div className="absolute bottom-20 left-4 right-16 z-10" data-reel-ui>
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/profile/${post.author.username}/`} onClick={(e) => e.stopPropagation()}>
                  <Avatar src={post.author.avatar} alt={post.author.displayName} size="sm" />
                </Link>
                <Link href={`/profile/${post.author.username}/`} onClick={(e) => e.stopPropagation()} className="min-w-0">
                  <UserName user={post.author} nameClassName="text-white font-semibold text-sm" />
                </Link>
                {!following && <FollowButton userId={post.author.id} size="sm" />}
              </div>
              {post.content && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCaptionOpen(!captionOpen); }}
                  className="text-white text-sm text-left line-clamp-2"
                >
                  {captionOpen ? post.content : post.content.slice(0, 80) + (post.content.length > 80 ? "..." : "")}
                </button>
              )}
            </div>
          </>
        )}

        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute bottom-6 right-4 z-20 p-2 rounded-full bg-black/50"
            data-reel-ui
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
        )}

        {!fullscreen && isVideo && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-10 pointer-events-none">
            <div
              className="h-full bg-white/80 transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="More">
        <div className="pb-4">
          {menuItems.map(({ icon: Icon, label, action, danger }) => (
            <button key={label} onClick={action} className={cn("flex items-center gap-3 w-full px-4 py-3.5 text-sm hover:bg-surface/50", danger && "text-like")}>
              <Icon className={cn("w-5 h-5", danger ? "text-like" : "text-text-muted")} />
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} post={post} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
      <ShareChatPicker
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share to"
        onSend={(ids) => showToast(`Shared to ${ids.length} chat${ids.length > 1 ? "s" : ""}`)}
      />
    </div>
  );
}
