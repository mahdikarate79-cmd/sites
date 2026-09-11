"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { FollowButton } from "@/components/ui/FollowButton";
import { LazyImage } from "@/components/ui/LazyImage";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { PostMenu } from "./PostMenu";
import { PostActions } from "./PostActions";
import { DonateModal } from "@/components/donate/DonateModal";
import { ReelsViewer } from "@/components/video/ReelsViewer";
import { formatTimeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { mockPosts } from "@/data/mock/posts";
import { buildReelItems, findReelIndex } from "@/lib/utils/reels";

interface PostCardProps {
  post: Post;
  onHide?: () => void;
  allPosts?: Post[];
}

export function PostCard({ post, onHide, allPosts }: PostCardProps) {
  const [donateOpen, setDonateOpen] = useState(false);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelMediaIndex, setReelMediaIndex] = useState(0);
  const { isFollowing, isBlocked } = usePrototype();

  if (isBlocked(post.author.id)) return null;

  const reelItems = useMemo(() => buildReelItems(allPosts ?? mockPosts), [allPosts]);
  const hasReelMedia = post.media?.some((m) => m.type === "video" || m.type === "image" || m.type === "gif");
  const profileHref = `/profile/${post.author.username}/`;

  const openReels = (mediaIndex: number) => {
    setReelMediaIndex(mediaIndex);
    setReelsOpen(true);
  };

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
                  {post.author.displayName}
                </Link>
                {post.author.verified && <VerifiedBadge />}
                <Link href={profileHref} className="text-text-muted text-sm truncate hover:underline">
                  @{post.author.username}
                </Link>
                <span className="text-text-muted text-sm">·</span>
                <span className="text-text-muted text-sm">{formatTimeAgo(post.createdAt)}</span>
                {!isFollowing(post.author.id) && post.author.id !== "u1" && (
                  <FollowButton userId={post.author.id} size="sm" className="ml-1" />
                )}
              </div>
              <PostMenu post={post} onHide={onHide} />
            </div>

            {post.content && (
              <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
            )}

            {post.media && post.media.length > 0 && (
              <div className={cn("mt-3 rounded-xl overflow-hidden border border-border", post.media.length > 1 && "grid grid-cols-2 gap-0.5")}>
                {post.media.map((m, i) =>
                  m.type === "video" ? (
                    <LazyVideo
                      key={i}
                      src={m.url}
                      thumbnail={m.thumbnail}
                      className="aspect-[9/16] max-h-[480px] cursor-pointer"
                      onPlay={() => openReels(i)}
                    />
                  ) : (
                    <button key={i} type="button" onClick={() => openReels(i)} className="block w-full cursor-pointer">
                      <LazyImage src={m.url} thumbnail={m.thumbnail} alt="Post image" className="aspect-[4/3]" />
                    </button>
                  )
                )}
              </div>
            )}

            <PostActions post={post} onDonate={() => setDonateOpen(true)} />
          </div>
        </div>
      </article>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} post={post} />

      {hasReelMedia && reelsOpen && (
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
