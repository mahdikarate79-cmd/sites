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
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DonateModal } from "@/components/donate/DonateModal";
import { ReportModal } from "@/components/feed/ReportModal";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCount } from "@/lib/utils/format";
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
  const [showHeart, setShowHeart] = useState(false);
  const [speed2x, setSpeed2x] = useState(false);
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
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open, initialIndex]);

  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    videoRef.current.playbackRate = speed2x ? 2 : 1;
    if (paused) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [paused, speed2x, index, isVideo]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) setIndex((i) => i + 1);
  }, [index, items.length]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const handleTap = (e: React.MouseEvent) => {
    if (!post) return;
    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;

    if (now - lastTap.current < 300 && relX > 0.25 && relX < 0.75) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      toggleLike(post.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 600);
      lastTap.current = 0;
      return;
    }

    lastTap.current = now;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (isVideo && relX > 0.25 && relX < 0.75) setPaused((p) => !p);
    }, 300);
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    if (relX <= 0.2 || relX >= 0.8) {
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
          <button onClick={onClose} className="absolute top-4 left-4 z-20 p-2 safe-top" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <button onClick={() => setMenuOpen(true)} className="absolute top-4 right-4 z-20 p-2 safe-top" aria-label="More">
            <MoreVertical className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      <div
        className="relative w-full h-dvh"
        onClick={handleTap}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            key={media.url}
            src={media.url}
            poster={media.thumbnail}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={muted}
            autoPlay
          />
        ) : (
          <Image src={media.url} alt="" fill className="object-cover" priority unoptimized />
        )}

        {isVideo && paused && !fullscreen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
              className="mb-4 p-2 rounded-full bg-black/40 pointer-events-auto"
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
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
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
              <button className="flex flex-col items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <Share2 className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-medium">{formatCount(post.shares)}</span>
              </button>
            </div>

            <div className="absolute bottom-20 left-4 right-16 z-10">
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/profile/${post.author.username}/`} onClick={(e) => e.stopPropagation()}>
                  <Avatar src={post.author.avatar} alt={post.author.displayName} size="sm" />
                </Link>
                <Link href={`/profile/${post.author.username}/`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 min-w-0">
                  <span className="text-white font-semibold text-sm truncate">{post.author.displayName}</span>
                  {post.author.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                </Link>
                {!following && <FollowButton userId={post.author.id} size="sm" />}
              </div>
              <p className="text-white text-xs mb-0.5">@{post.author.username}</p>
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
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-10">
          <div className="h-full bg-white/80 transition-all duration-300" style={{ width: `${((index + 1) / items.length) * 100}%` }} />
        </div>
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
    </div>
  );
}
