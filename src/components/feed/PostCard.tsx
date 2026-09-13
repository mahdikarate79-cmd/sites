"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Post } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { FollowButton } from "@/components/ui/FollowButton";
import { LazyImage } from "@/components/ui/LazyImage";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { PostMenu } from "./PostMenu";
import { PostActions } from "./PostActions";
import { PostAccessModal } from "./PostAccessModal";
import { DonateModal } from "@/components/donate/DonateModal";
import { ReelsViewer } from "@/components/video/ReelsViewer";
import { SpoilerOverlay, PaidPriceBadge } from "@/components/chat/SpoilerOverlay";
import { formatTimeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { createPostUnlockInvoice, openTelegramInvoice } from "@/lib/api/payments";
import { useToast } from "@/components/ui/ToastProvider";
import { buildAccessibleReelItems, findReelIndex } from "@/lib/utils/reels";
import { hasPrivateAccess, isPostPaid, isPostPrivate, PostAccessContext } from "@/lib/utils/postAccess";

interface PostCardProps {
  post: Post;
  onHide?: () => void;
  allPosts?: Post[];
}

export function PostCard({ post, onHide, allPosts }: PostCardProps) {
  const [donateOpen, setDonateOpen] = useState(false);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelMediaIndex, setReelMediaIndex] = useState(0);
  const [accessModal, setAccessModal] = useState<"paid" | "private" | null>(null);
  const { isFollowing, getCurrentUser } = usePrototype();
  const { isPostUnlocked, refresh, refreshUnlocks, isAuthenticated } = useAuth();
  const { requireMiniApp } = useTelegramGate();
  const { showToast } = useToast();
  const [unlocking, setUnlocking] = useState(false);

  const user = getCurrentUser();
  const isAuthor = post.author.id === user.id;
  const accessCtx: PostAccessContext = {
    viewerId: user.id,
    isFollowing,
    isUnlocked: (id: string) => isPostUnlocked(id),
  };
  const paid = isPostPaid(post);
  const privatePost = isPostPrivate(post);
  const privateLocked = privatePost && !isAuthor && !hasPrivateAccess(post, accessCtx);
  const paidLocked = paid && !isAuthor && !isPostUnlocked(post.id) && !privateLocked;

  const reelSource = allPosts ?? [];
  const reelItems = useMemo(
    () => buildAccessibleReelItems(reelSource, accessCtx),
    [reelSource, user.id, isFollowing, isPostUnlocked]
  );
  const hasReelMedia = post.media?.some((m) => m.type === "video" || m.type === "image" || m.type === "gif");
  const profileHref = `/profile/${post.author.username || post.author.id}/`;

  const openReels = (mediaIndex: number) => {
    if (paidLocked || privateLocked) return;
    setReelMediaIndex(mediaIndex);
    setReelsOpen(true);
  };

  const handleMediaClick = () => {
    if (paidLocked) {
      if (requireMiniApp()) setAccessModal("paid");
    } else if (privateLocked) {
      if (requireMiniApp()) setAccessModal("private");
    }
  };

  const handleUnlock = async () => {
    if (!requireMiniApp()) return;
    if (!isAuthenticated || !post.paidStars || unlocking) return;
    setUnlocking(true);
    try {
      const invoice = await createPostUnlockInvoice(post.id, post.paidStars);
      if (!invoice.invoiceUrl) {
        showToast("Payment unavailable");
        return;
      }
      const opened = openTelegramInvoice(invoice.invoiceUrl, async (status) => {
        if (status === "paid") {
          await refreshUnlocks();
          await refresh();
          showToast("Content unlocked");
          setAccessModal(null);
        } else if (status === "failed") {
          showToast("Payment failed");
        }
        setUnlocking(false);
      });
      if (!opened) {
        showToast("Open in Telegram to pay with Stars");
        setUnlocking(false);
      }
    } catch {
      showToast("Payment failed");
      setUnlocking(false);
    }
  };

  const showMediaOverlay = paidLocked || privateLocked;

  return (
    <>
      <article className="px-4 py-3 border-b border-border">
        <div className="flex gap-3">
          <Link href={profileHref} className="shrink-0">
            <Avatar src={post.author.avatar} alt={post.author.displayName} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-wrap">
                <Link href={profileHref} className="font-semibold text-sm truncate hover:underline">
                  <UserName user={post.author} nameClassName="font-semibold text-sm" />
                </Link>
                <span className="text-text-muted text-sm">·</span>
                <span className="text-text-muted text-sm">{formatTimeAgo(post.createdAt)}</span>
                {!isFollowing(post.author.id) && post.author.id !== user.id && (
                  <FollowButton userId={post.author.id} size="sm" className="ml-1" />
                )}
              </div>
              <PostMenu post={post} onHide={onHide} />
            </div>

            {post.content && (
              <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
            )}

            {post.media && post.media.length > 0 && (
              <div className={cn("mt-3 rounded-xl overflow-hidden border border-border relative", post.media.length > 1 && "grid grid-cols-2 gap-0.5")}>
                {post.media.map((m, i) => (
                  <div key={i} className="relative">
                    {m.type === "video" ? (
                      <LazyVideo
                        src={m.url}
                        thumbnail={m.thumbnail ?? m.url}
                        className="aspect-[9/16] max-h-[480px] cursor-pointer"
                        blurred={showMediaOverlay}
                        onPlay={() => (showMediaOverlay ? handleMediaClick() : openReels(i))}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => (showMediaOverlay ? handleMediaClick() : openReels(i))}
                        className="block w-full cursor-pointer relative"
                      >
                        <LazyImage
                          src={m.url}
                          thumbnail={m.thumbnail}
                          alt="Post image"
                          className="aspect-[4/3]"
                          blurred={showMediaOverlay}
                        />
                      </button>
                    )}
                    {showMediaOverlay && i === 0 && (
                      paidLocked ? (
                        <SpoilerOverlay stars={post.paidStars} onClick={handleMediaClick} />
                      ) : (
                        <button
                          type="button"
                          onClick={handleMediaClick}
                          className="absolute inset-0 flex items-center justify-center overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" aria-hidden />
                          <div className="relative z-[1] px-4 py-3 rounded-2xl glass-pill flex items-center gap-2">
                            <Lock className="w-5 h-5 text-white/90" />
                            <span className="text-xs text-white/90 font-medium">Private</span>
                          </div>
                        </button>
                      )
                    )}
                    {paid && isAuthor && i === 0 && <PaidPriceBadge stars={post.paidStars!} />}
                  </div>
                ))}
              </div>
            )}

            <PostActions post={post} onDonate={() => { if (requireMiniApp()) setDonateOpen(true); }} />
          </div>
        </div>
      </article>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} post={post} />

      {accessModal && (
        <PostAccessModal
          open
          onClose={() => setAccessModal(null)}
          post={post}
          variant={accessModal}
          onUnlock={accessModal === "paid" ? handleUnlock : undefined}
        />
      )}

      {hasReelMedia && reelsOpen && !showMediaOverlay && (
        <ReelsViewer
          open
          onClose={() => setReelsOpen(false)}
          items={reelItems}
          initialIndex={findReelIndex(reelItems, post.id, reelMediaIndex)}
        />
      )}
    </>
  );
}
