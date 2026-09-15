"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft, Heart, MessageCircle, Share2, MoreVertical, Eye,
  Volume2, VolumeX, Play, Minimize2, Bookmark, Flag, ThumbsDown, Maximize, Link2,
} from "lucide-react";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
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
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { toggleLikeApi } from "@/lib/api/social";
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
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [speed2x, setSpeed2x] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolling = useRef(false);
  const { isLiked, toggleLike, getDonation, isFollowing, markInterested, markNotInterested, hidePost, toggleBookmark, isBookmarked, getCurrentUser } = usePrototype();
  const user = getCurrentUser();
  const { requireMiniApp } = useTelegramGate();
  const { showToast } = useToast();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const reel of items) counts[reel.post.id] = reel.post.likes;
    setLikeCounts(counts);
  }, [items]);

  const handleLike = async (postId: string) => {
    if (!requireMiniApp()) return;
    const nowLiked = toggleLike(postId);
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: nowLiked ? (prev[postId] ?? 0) + 1 : Math.max(0, (prev[postId] ?? 1) - 1),
    }));
    try {
      const result = await toggleLikeApi(postId);
      setLikeCounts((prev) => ({ ...prev, [postId]: result.likes }));
    } catch {
      toggleLike(postId);
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: nowLiked ? Math.max(0, (prev[postId] ?? 1) - 1) : (prev[postId] ?? 0) + 1,
      }));
    }
  };

  const item = items[index];
  const post = item?.post;
  const media = item?.media;
  const isVideo = media?.type === "video";

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
    setPaused(false);
    setProgress(0);
    setCaptionExpanded(false);
    lockScroll();
    return () => unlockScroll();
  }, [open, initialIndex]);

  useEffect(() => {
    setCaptionExpanded(false);
  }, [index]);

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = initialIndex * el.clientHeight;
    });
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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || scrolling.current) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== index && i >= 0 && i < items.length) {
      setIndex(i);
      setProgress(0);
      setPaused(false);
    }
  }, [index, items.length]);

  const scrollToIndex = (i: number) => {
    const el = scrollRef.current;
    if (!el || i < 0 || i >= items.length) return;
    scrolling.current = true;
    el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
    setIndex(i);
    setProgress(0);
    setPaused(false);
    setTimeout(() => { scrolling.current = false; }, 400);
  };

  const handleVideoTap = (e: React.MouseEvent) => {
    if (!post || !isVideo) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-reel-ui]")) return;

    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const inCenter = relX > 0.2 && relX < 0.8;

    if (now - lastTap.current < 300 && inCenter) {
      if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
      lastTap.current = 0;
      if (!requireMiniApp()) return;
      handleLike(post.id);
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
    const { getPostShareUrl } = await import("@/lib/utils/siteUrl");
    await navigator.clipboard.writeText(getPostShareUrl(post.id));
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
    <div className="fixed inset-0 z-50 bg-black">
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
        ref={scrollRef}
        className="h-dvh overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onClick={isVideo ? handleVideoTap : undefined}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {items.map((reelItem, i) => {
          const reelMedia = reelItem.media;
          const reelIsVideo = reelMedia.type === "video";
          const reelPost = reelItem.post;
          const isActive = i === index;

          return (
            <div
              key={`${reelItem.post.id}-${reelItem.mediaIndex}`}
              className="relative w-full h-dvh snap-start snap-always shrink-0 bg-black"
            >
              {reelIsVideo ? (
                <video
                  ref={isActive ? videoRef : undefined}
                  src={reelMedia.url}
                  poster={reelMedia.thumbnail ?? reelMedia.url}
                  className="w-full h-full object-contain bg-black"
                  loop
                  playsInline
                  muted={muted}
                  autoPlay={isActive}
                />
              ) : (
                <Image
                  src={reelMedia.url}
                  alt=""
                  fill
                  className="object-contain bg-black"
                  priority={isActive}
                  unoptimized
                />
              )}

              {isActive && reelIsVideo && paused && !fullscreen && (
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

              {isActive && showHeart && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <Heart className="w-24 h-24 text-like fill-like animate-[heart-burst_0.6s_ease-out]" />
                </div>
              )}

              {isActive && speed2x && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium z-30">
                  2x
                </div>
              )}

              {isActive && !fullscreen && (
                <>
                  <div
                    className="absolute right-3 flex flex-col items-center gap-5 z-10 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))]"
                    data-reel-ui
                  >
                    <button onClick={(e) => { e.stopPropagation(); handleLike(reelPost.id); }} className="flex flex-col items-center gap-0.5">
                      <Heart className={cn("w-7 h-7 drop-shadow", isLiked(reelPost.id) ? "text-like fill-like" : "text-white")} />
                      <span className="text-white text-xs font-medium drop-shadow">{formatCount(likeCounts[reelPost.id] ?? reelPost.likes)}</span>
                    </button>
                    <div onClick={(e) => { e.stopPropagation(); if (requireMiniApp()) setDonateOpen(true); }}>
                      <DonateButton total={getDonation(reelPost.id, { total: reelPost.stars ?? 0, topDonators: reelPost.topDonators ?? [] }).total} donated={getDonation(reelPost.id).userDonated} onClick={() => setDonateOpen(true)} vertical size="sm" />
                    </div>
                    <button className="flex flex-col items-center gap-0.5" onClick={(e) => { e.stopPropagation(); if (requireMiniApp()) setCommentsOpen(true); }}>
                      <MessageCircle className="w-7 h-7 text-white drop-shadow" />
                      <span className="text-white text-xs font-medium drop-shadow">{formatCount(reelPost.comments)}</span>
                    </button>
                    <div className="flex flex-col items-center gap-0.5 pointer-events-none">
                      <Eye className="w-7 h-7 text-white drop-shadow" />
                      <span className="text-white text-xs font-medium drop-shadow">{formatCount(reelPost.views)}</span>
                    </div>
                    <button className="flex flex-col items-center gap-0.5" onClick={(e) => { e.stopPropagation(); if (requireMiniApp()) setShareOpen(true); }}>
                      <Share2 className="w-7 h-7 text-white drop-shadow" />
                      <span className="text-white text-xs font-medium drop-shadow">{formatCount(reelPost.shares)}</span>
                    </button>
                  </div>

                  <div
                    className="absolute left-4 right-16 z-10 bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
                    data-reel-ui
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <ProfileLink user={reelPost.author} onClick={(e) => e.stopPropagation()}>
                        <Avatar src={reelPost.author.avatar} alt={reelPost.author.displayName} size="sm" />
                      </ProfileLink>
                      <ProfileLink user={reelPost.author} onClick={(e) => e.stopPropagation()} className="min-w-0">
                        <UserName user={reelPost.author} nameClassName="text-white font-semibold text-sm drop-shadow" />
                      </ProfileLink>
                      {!isFollowing(reelPost.author.id) && reelPost.author.id !== user.id && (
                        <FollowButton userId={reelPost.author.id} size="sm" />
                      )}
                    </div>
                    {reelPost.content && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCaptionExpanded(true); }}
                        className="text-white text-sm text-left line-clamp-1 drop-shadow w-full"
                      >
                        {reelPost.content}
                      </button>
                    )}
                  </div>
                </>
              )}

              {isActive && !fullscreen && reelIsVideo && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-10 pointer-events-none">
                  <div className="h-full bg-white/80 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fullscreen && (
        <button onClick={() => setFullscreen(false)} className="absolute bottom-6 right-4 z-20 p-2 rounded-full bg-black/50" data-reel-ui aria-label="Exit fullscreen">
          <Minimize2 className="w-5 h-5 text-white" />
        </button>
      )}

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

      {captionExpanded && post.content && (
        <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" data-reel-ui>
          <button
            type="button"
            className="absolute inset-0 -top-[100dvh] bg-black/40"
            onClick={() => setCaptionExpanded(false)}
            aria-label="Close caption"
          />
          <div className="relative glass-nav rounded-2xl px-4 py-3.5 max-h-[40dvh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Avatar src={post.author.avatar} alt="" size="sm" />
              <UserName user={post.author} nameClassName="text-sm font-semibold" />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>
      )}

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} post={post} />
      <CommentsSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} postId={post.id} initialCount={post.comments} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} postId={post.id} userId={post.author.id} />
      <ShareChatPicker open={shareOpen} onClose={() => setShareOpen(false)} title="Share to" onSend={(ids) => showToast(`Shared to ${ids.length} chat${ids.length > 1 ? "s" : ""}`)} />
    </div>
  );
}
