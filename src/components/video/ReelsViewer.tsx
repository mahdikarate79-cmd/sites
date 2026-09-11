"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Heart, MessageCircle, Share2, MoreVertical,
  Volume2, VolumeX, Play, Minimize2,
} from "lucide-react";
import { Post } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { DonateButton } from "@/components/ui/DonateButton";
import { FollowButton } from "@/components/ui/FollowButton";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { DonateModal } from "@/components/donate/DonateModal";
import { ReportModal } from "@/components/feed/ReportModal";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface ReelsViewerProps {
  open: boolean;
  onClose: () => void;
  posts: Post[];
  initialIndex: number;
}

export function ReelsViewer({ open, onClose, posts, initialIndex }: ReelsViewerProps) {
  const [index] = useState(initialIndex);
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
  const lastTap = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdSide = useRef<"left" | "right" | null>(null);
  const { isLiked, toggleLike, getDonation, isFollowing } = usePrototype();
  const { showToast } = useToast();

  const post = posts[index];
  const video = post?.media?.find((m) => m.type === "video");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed2x ? 2 : 1;
    if (paused) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [paused, speed2x, index]);

  const handleTap = (e: React.MouseEvent) => {
    if (!post) return;
    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;

    if (now - lastTap.current < 300 && relX > 0.3 && relX < 0.7) {
      toggleLike(post.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 600);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    if (relX > 0.3 && relX < 0.7) {
      setPaused((p) => !p);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    if (relX <= 0.3) holdSide.current = "left";
    else if (relX >= 0.7) holdSide.current = "right";
    else return;

    holdTimer.current = setTimeout(() => setSpeed2x(true), 300);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdSide.current = null;
    setSpeed2x(false);
  };

  if (!open || !post || !video) return null;

  const liked = isLiked(post.id);
  const donation = getDonation(post.id, { total: post.stars ?? 0, topDonators: post.topDonators ?? [] });
  const following = isFollowing(post.author.id);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://sheytoni.app/post/${post.id}`);
    showToast("🔗 لینک کپی شد");
    setMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {!fullscreen && (
        <>
          <button onClick={onClose} className="absolute top-4 left-4 z-20 p-2 safe-top" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="absolute top-4 right-4 z-20 p-2 safe-top" aria-label="More">
            <MoreVertical className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      <div
        className="relative w-full h-dvh"
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <video
          ref={videoRef}
          src={video.url}
          poster={video.thumbnail}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={muted}
          autoPlay
        />

        {paused && !fullscreen && (
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-like fill-like animate-[heart-burst_0.6s_ease-out]" />
          </div>
        )}

        {speed2x && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium">
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
                <Avatar src={post.author.avatar} alt={post.author.displayName} size="sm" />
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-white font-semibold text-sm truncate">{post.author.displayName}</span>
                  {post.author.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                </div>
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
          <div className="h-full bg-white/80 w-1/3" />
        </div>
      </div>

      {menuOpen && (
        <div className="absolute top-14 right-4 z-30 w-48 bg-surface border border-border rounded-xl py-1 shadow-lg">
          {[
            { emoji: "🔖", label: "Save", action: () => setMenuOpen(false) },
            { emoji: "🔗", label: "Copy Link", action: copyLink },
            { emoji: "🚨", label: "Report", action: () => { setReportOpen(true); setMenuOpen(false); }, danger: true },
            { emoji: "❤️", label: "Interested", action: () => setMenuOpen(false) },
            { emoji: "👎", label: "Not Interested", action: () => { onClose(); setMenuOpen(false); } },
            { emoji: "⛶", label: "Fullscreen", action: () => { setFullscreen(true); setMenuOpen(false); } },
          ].map(({ emoji, label, action, danger }) => (
            <button key={label} onClick={action} className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-bg ${danger ? "text-like" : ""}`}>
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>
      )}

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} post={post} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
