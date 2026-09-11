"use client";

import { useState } from "react";
import { Heart, MessageCircle, Eye, Share2, Bookmark } from "lucide-react";
import { Post } from "@/lib/types";
import { formatCount } from "@/lib/utils/format";
import { TelegramStar } from "@/components/ui/TelegramStar";
import { cn } from "@/lib/utils/cn";
import { toggleLike, toggleBookmark } from "@/lib/api/posts";

interface PostActionsProps {
  post: Post;
  onDonate: () => void;
}

export function PostActions({ post, onDonate }: PostActionsProps) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likes, setLikes] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(post.bookmarked ?? false);
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);
    try {
      const result = await toggleLike(post.id);
      setLiked(result.liked);
      setLikes(result.likes);
    } catch {
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(post.id);
      setBookmarked(result.bookmarked);
    } catch {
      setBookmarked(!bookmarked);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Sheytoni", text: post.content });
    }
  };

  return (
    <div className="flex items-center justify-between mt-3 -ml-1">
      <div className="flex items-center gap-0.5">
        <button
          onClick={onDonate}
          className="relative flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors group"
          aria-label="Donate Stars"
        >
          <TelegramStar size="md" showParticles />
        </button>

        <button
          onClick={handleLike}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            className={cn(
              "w-[18px] h-[18px] transition-colors",
              liked ? "text-like fill-like" : "text-text-muted",
              animating && "animate-like"
            )}
          />
          {likes > 0 && <span className="text-xs text-text-muted">{formatCount(likes)}</span>}
        </button>

        <button
          className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors"
          aria-label="Comments"
        >
          <MessageCircle className="w-[18px] h-[18px] text-text-muted" />
          {post.comments > 0 && <span className="text-xs text-text-muted">{formatCount(post.comments)}</span>}
        </button>

        <button
          className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors"
          aria-label="Views"
        >
          <Eye className="w-[18px] h-[18px] text-text-muted" />
          {post.views > 0 && <span className="text-xs text-text-muted">{formatCount(post.views)}</span>}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-surface transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-[18px] h-[18px] text-text-muted" />
        </button>
      </div>

      <button
        onClick={handleBookmark}
        className="p-1.5 rounded-full hover:bg-surface transition-colors"
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
      >
        <Bookmark
          className={cn(
            "w-[18px] h-[18px]",
            bookmarked ? "text-text fill-text" : "text-text-muted"
          )}
        />
      </button>
    </div>
  );
}
